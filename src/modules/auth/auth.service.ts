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
import * as crypto from 'crypto';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Organisation, OrganisationDocument } from '../organizations/schemas/organization.schema';
import { TokenService } from './tokens.service';
import { MailService } from '../../mail/mail.service';

import { Role } from '../../common/enums/role.enum';

import { ROLE_PERMISSIONS, canManageRole } from '../../common/enums/Permission.matrix';

import { RequestUser } from '../../common/interfaces/jwt.interface';

import {
    RegisterSuperOwnerDto,
    CreateUserDto,
    LoginDto,
    UpdateUserRoleDto,
    VerifyEmailDto,
    ResendVerificationDto,
} from '../../common/dto/index.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Organisation.name) private readonly orgModel: Model<OrganisationDocument>,
        private readonly tokenService: TokenService,
        private readonly mailService: MailService,
    ) { }

    // ── Helper: generate email verification token ─────────────────────────────
    private generateEmailVerificationToken() {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        return { rawToken, tokenHash, expiresAt };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1 — Called ONCE when the software is purchased
    // ══════════════════════════════════════════════════════════════════════════
    async registerSuperOwner(dto: RegisterSuperOwnerDto) {
        const emailTaken = await this.userModel.findOne({ email: dto.email.toLowerCase() });
        if (emailTaken) throw new ConflictException('Email is already registered');

        // 1. Create the organisation
        const org = await this.orgModel.create({ name: dto.organizationName });

        // 2. Generate verification token
        const { rawToken, tokenHash, expiresAt } = this.generateEmailVerificationToken();

        // 3. Create the super owner user
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            password: passwordHash,
            role: Role.SUPER_OWNER,
            isSuperOwner: true,
            orgId: org._id,
            isEmailVerified: false,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: expiresAt,
        });

        // 4. Link the org back to the super owner
        await this.orgModel.findByIdAndUpdate(org._id, { superOwnerId: user._id });

        // 5. Send verification email
        try {
            await this.mailService.sendVerificationEmail(user.email, user.name, rawToken);
        } catch (error) {
            console.error('Failed to send verification email:', error);
        }

        return {
            message: 'Super Owner account created successfully. Please check your email to verify your address.',
            userId: (user._id as any).toString(),
            orgId: (org._id as any).toString(),
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EMAIL VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    async verifyEmail(dto: VerifyEmailDto) {
        const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

        const user = await this.userModel
            .findOne({
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: { $gt: new Date() },
            })
            .select('+emailVerificationTokenHash +emailVerificationExpiresAt');

        if (!user) {
            throw new BadRequestException('Invalid or expired email verification token');
        }

        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        user.emailVerificationTokenHash = null;
        user.emailVerificationExpiresAt = null;

        await user.save();

        return { message: 'Email address verified successfully' };
    }

    async resendVerificationEmail(dto: ResendVerificationDto) {
        const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });

        if (!user) {
            // Return success message to prevent user enumeration
            return { message: 'If an account exists with this email, a verification link has been sent.' };
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email address is already verified');
        }

        const { rawToken, tokenHash, expiresAt } = this.generateEmailVerificationToken();

        user.emailVerificationTokenHash = tokenHash;
        user.emailVerificationExpiresAt = expiresAt;
        await user.save();

        try {
            await this.mailService.sendVerificationEmail(user.email, user.name, rawToken);
        } catch (error) {
            console.error('Failed to send verification email:', error);
        }

        return { message: 'If an account exists with this email, a verification link has been sent.' };
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

        const { rawToken, tokenHash, expiresAt } = this.generateEmailVerificationToken();

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            password: passwordHash,
            role: dto.role,
            orgId: new Types.ObjectId(actor.orgId),
            createdBy: new Types.ObjectId(actor.id),
            isEmailVerified: false,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: expiresAt,
        });

        try {
            await this.mailService.sendEmployeeInvitationEmail(user.email, user.name, rawToken, dto.password);
        } catch (error) {
            console.error('Failed to send employee invitation email:', error);
        }

        return {
            message: 'Employee created successfully. Invitation and verification email sent.',
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
            isEmailVerified: user.isEmailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
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

