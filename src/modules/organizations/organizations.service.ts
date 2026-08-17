import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organisation, OrganisationDocument } from './schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RequestUser } from '../../common/interfaces/jwt.interface';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectModel(Organisation.name) private readonly orgModel: Model<OrganisationDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { }

    /**
     * Create a new organization / branch farm.
     * Super Owner only.
     */
    async createOrganization(actor: RequestUser, dto: CreateOrganizationDto) {
        if (!actor.isSuperOwner) {
            throw new ForbiddenException('Only a Super Owner can create new organizations.');
        }

        const existing = await this.orgModel.findOne({ name: dto.name.trim() });
        if (existing) {
            throw new ConflictException(`Organization "${dto.name}" already exists.`);
        }

        const org = await this.orgModel.create({
            name: dto.name.trim(),
            superOwnerId: new Types.ObjectId(actor.id),
            isActive: true,
        });

        return org;
    }

    /**
     * Get list of accessible organizations for the user/Super Owner.
     */
    async getAccessibleOrganizations(actor: RequestUser) {
        if (actor.isSuperOwner) {
            // Super Owner can see all active organizations they own
            return this.orgModel.find({
                $or: [
                    { superOwnerId: new Types.ObjectId(actor.id) },
                    { _id: new Types.ObjectId(actor.orgId) },
                ],
                isActive: true,
            }).exec();
        }

        // Standard user can only access their assigned organization
        return this.orgModel.find({
            _id: new Types.ObjectId(actor.orgId),
            isActive: true,
        }).exec();
    }

    /**
     * Get single organization details by ID.
     */
    async getOrganizationById(actor: RequestUser, orgId: string) {
        const org = await this.orgModel.findById(orgId).exec();
        if (!org) {
            throw new NotFoundException('Organization not found.');
        }

        if (!actor.isSuperOwner && actor.orgId !== orgId) {
            throw new ForbiddenException('Access denied to this organization.');
        }

        return org;
    }

    /**
     * Update organization details.
     */
    async updateOrganization(actor: RequestUser, orgId: string, dto: UpdateOrganizationDto) {
        if (!actor.isSuperOwner) {
            throw new ForbiddenException('Only a Super Owner can update organization details.');
        }

        const updated = await this.orgModel.findByIdAndUpdate(orgId, dto, { new: true }).exec();
        if (!updated) {
            throw new NotFoundException('Organization not found.');
        }

        return updated;
    }

    /**
     * Switch active organization for Super Owner.
     */
    async switchOrganizationContext(actor: RequestUser, newOrgId: string) {
        if (!actor.isSuperOwner) {
            throw new ForbiddenException('Only Super Owners can switch active organization context.');
        }

        const targetOrg = await this.orgModel.findById(newOrgId).exec();
        if (!targetOrg || !targetOrg.isActive) {
            throw new NotFoundException('Target organization not found or inactive.');
        }

        // Update user's primary active orgId
        await this.userModel.findByIdAndUpdate(actor.id, { orgId: targetOrg._id });

        return {
            message: `Switched active organization to ${targetOrg.name}`,
            currentOrganization: {
                id: (targetOrg._id as any).toString(),
                name: targetOrg.name,
            },
        };
    }
}
