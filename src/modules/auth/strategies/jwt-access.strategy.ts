import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtPayload, RequestUser } from '../../../common/interfaces/jwt.interface';
import { ROLE_PERMISSIONS } from '../../../common/enums/Permission.matrix';
import { User, UserDocument } from '../../users/schemas/user.schema';

/**
 * Strategy name: 'jwt-access'
 * Validates Bearer tokens signed with JWT_ACCESS_SECRET.
 * Attaches a RequestUser to req.user on success.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(
        config: ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {
        const accessSecret = config.get<string>('JWT_ACCESS_SECRET');

        if (!accessSecret) {
            throw new Error('JWT_ACCESS_SECRET is not defined');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: accessSecret,
        });
    }

    async validate(payload: JwtPayload): Promise<RequestUser> {
        if (payload.type !== 'access') {
            throw new UnauthorizedException('Not an access token');
        }

        const user = await this.userModel
            .findById(payload.sub)
            .select('-password -refreshTokenHash')
            .exec();

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or deactivated');
        }

        return {
            id: (user._id as any).toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            orgId: user.orgId.toString(),
            isSuperOwner: user.isSuperOwner,
            permissions: ROLE_PERMISSIONS[user.role] ?? [],
            phone: user.phone,
            photoUrl: user.photoUrl,
            isAvailable: user.isAvailable,
            statusMessage: user.statusMessage,
        };
    }
}
