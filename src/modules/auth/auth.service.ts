import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Organisation, OrganisationDocument } from '../organizations/schemas/organization.schema';
import { TokenService } from './tokens.service';

import { Role } from '../../common/enums/role.enum';

import { ROLE_PERMISSIONS, canManageRole } from '../../common/enums/Permission.matrix';

import { RequestUser } from '../../common/interfaces/jwt.interface';

import {
    RegisterSuperOwnerDto,
    CreateUserDto,
    LoginDto,
    UpdateUserRoleDto,
} from '../../common/dto/index.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Organisation.name) private readonly orgModel: Model<OrganisationDocument>,
        private readonly tokenService: TokenService,
    ) { }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1 — Called ONCE when the software is purchased
    // ══════════════════════════════════════════════════════════════════════════
    async registerSuperOwner(dto: RegisterSuperOwnerDto) {
        const emailTaken = await this.userModel.findOne({ email: dto.email.toLowerCase() });
        if (emailTaken) throw new ConflictException('Email is already registered');

        // 1. Create the organisation
        const org = await this.orgModel.create({ name: dto.organizationName });

        // 2. Create the super owner user
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            password: passwordHash,
            role: Role.SUPER_OWNER,
            isSuperOwner: true,
            orgId: org._id,
        });

        // 3. Link the org back to the super owner
        await this.orgModel.findByIdAndUpdate(org._id, { superOwnerId: user._id });

        return {
            message: 'Super Owner account created successfully',
            userId: (user._id as any).toString(),
            orgId: (org._id as any).toString(),
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOGIN — identical for every role
    // ══════════════════════════════════════════════════════════════════════════
    async login(dto: LoginDto, userAgent?: string) {
        // Load user including password field (excluded by default)
        const user = await this.userModel
            .findOne({ email: dto.email.toLowerCase() })
            .select('+password')
            .exec();

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate access + refresh token pair
        const tokens = await this.tokenService.generateTokenPair(user);

        return {
            ...tokens,
            user: this.buildUserResponse(user),
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REFRESH — rotates both tokens
    // ══════════════════════════════════════════════════════════════════════════
    async refresh(rawRefreshToken: string) {
        return this.tokenService.rotateRefreshToken(rawRefreshToken);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOGOUT — revokes current session
    // ══════════════════════════════════════════════════════════════════════════
    async logout(userId: string) {
        await this.tokenService.revokeToken(userId);
        return { message: 'Logged out successfully' };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // USER MANAGEMENT — Owner / Super Owner only
    // ══════════════════════════════════════════════════════════════════════════

    async createUser(actor: RequestUser, dto: CreateUserDto) {
        // Enforce hierarchy — cannot create a user equal to or above yourself
        if (!actor.isSuperOwner && !canManageRole(actor.role, dto.role)) {
            throw new ForbiddenException(
                `You cannot create a user with role "${dto.role}"`,
            );
        }

        // Super Owner cannot be created via API
        if (dto.role === Role.SUPER_OWNER) {
            throw new ForbiddenException('Super Owner role cannot be assigned via API');
        }

        const emailTaken = await this.userModel.findOne({ email: dto.email.toLowerCase() });
        if (emailTaken) throw new ConflictException('Email is already registered');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            password: passwordHash,
            role: dto.role,
            orgId: new Types.ObjectId(actor.orgId),
            createdBy: new Types.ObjectId(actor.id),
        });

        return {
            message: 'User created successfully',
            userId: (user._id as any).toString(),
        };
    }

    async listOrgUsers(actor: RequestUser) {
        const users = await this.userModel
            .find({ orgId: new Types.ObjectId(actor.orgId) })
            .select('-password -refreshTokenHash')
            .sort({ createdAt: -1 })
            .exec();

        return users.map((u) => this.buildUserResponse(u));
    }

    async updateUserRole(actor: RequestUser, dto: UpdateUserRoleDto) {
        if (dto.newRole === Role.SUPER_OWNER) {
            throw new ForbiddenException('Cannot assign Super Owner role via API');
        }

        const target = await this.userModel.findOne({
            _id: new Types.ObjectId(dto.userId),
            orgId: new Types.ObjectId(actor.orgId),
        });

        if (!target) throw new NotFoundException('User not found in your organisation');
        if (target.isSuperOwner) throw new ForbiddenException('Cannot change Super Owner role');

        if (!actor.isSuperOwner) {
            if (!canManageRole(actor.role, target.role))
                throw new ForbiddenException('You do not have permission to manage this user');
            if (!canManageRole(actor.role, dto.newRole))
                throw new ForbiddenException(`You cannot assign role "${dto.newRole}"`);
        }

        await this.userModel.findByIdAndUpdate(target._id, { role: dto.newRole });
        return { message: `Role updated to "${dto.newRole}"` };
    }

    async deactivateUser(actor: RequestUser, targetUserId: string) {
        const target = await this.userModel.findOne({
            _id: new Types.ObjectId(targetUserId),
            orgId: new Types.ObjectId(actor.orgId),
        });

        if (!target) throw new NotFoundException('User not found');
        if (target.isSuperOwner) throw new ForbiddenException('Cannot deactivate Super Owner');
        if (!actor.isSuperOwner && !canManageRole(actor.role, target.role))
            throw new ForbiddenException('Insufficient permissions');

        await this.userModel.findByIdAndUpdate(target._id, {
            isActive: false,
            refreshTokenHash: null, // revoke all sessions
        });

        return { message: 'User deactivated and sessions revoked' };
    }

    async getUserById(actor: RequestUser, targetUserId: string) {
        const user = await this.userModel.findOne({
            _id: new Types.ObjectId(targetUserId),
            orgId: new Types.ObjectId(actor.orgId),
        }).select('-password -refreshTokenHash');

        if (!user) throw new NotFoundException('User not found');
        return this.buildUserResponse(user);
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private buildUserResponse(user: UserDocument) {
        return {
            id: (user._id as any).toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isSuperOwner: user.isSuperOwner,
            isActive: user.isActive,
            orgId: user.orgId.toString(),
            phone: user.phone,
            photoUrl: user.photoUrl,
            isAvailable: user.isAvailable,
            statusMessage: user.statusMessage,
            permissions: ROLE_PERMISSIONS[user.role] ?? [],
            createdAt: (user as any).createdAt,
        };
    }
}
