import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestUser } from '../../common/interfaces/jwt.interface';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { }

    /**
     * Update current user's profile details.
     */
    async updateProfile(actor: RequestUser, dto: UpdateProfileDto) {
        const user = await this.userModel.findByIdAndUpdate(actor.id, dto, { new: true }).exec();
        if (!user) {
            throw new NotFoundException('User profile not found');
        }
        return user;
    }

    /**
     * List all users/employees in the user's organization.
     */
    async listOrgUsers(actor: RequestUser) {
        const query: any = { isDeleted: { $ne: true } };

        if (!actor.isSuperOwner) {
            query.orgId = new Types.ObjectId(actor.orgId);
        }

        return this.userModel.find(query).exec();
    }
}
