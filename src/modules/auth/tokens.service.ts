import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtPayload, TokenPair } from '../../common/interfaces/jwt.interface';

@Injectable()
export class TokenService {
    private readonly ACCESS_TTL: number;
    private readonly REFRESH_TTL: number;

    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {
        this.ACCESS_TTL = Number(this.config.get('JWT_ACCESS_TTL', 900));     // 15 min
        this.REFRESH_TTL = Number(this.config.get('JWT_REFRESH_TTL', 604800));  // 7 days
    }

    // ── Generate a fresh access + refresh token pair ──────────────────────────
    async generateTokenPair(user: UserDocument): Promise<TokenPair> {
        const base = {
            sub: (user._id as any).toString(),
            email: user.email,
            role: user.role,
            orgId: user.orgId ? user.orgId.toString() : undefined,
            isSuperOwner: user.isSuperOwner,
        };

        // Access token — short-lived, signed with ACCESS secret
        const accessToken = this.jwt.sign(
            { ...base, type: 'access' },
            {
                secret: this.config.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.ACCESS_TTL,
            },
        );

        // Refresh token — long-lived, signed with REFRESH secret
        const refreshToken = this.jwt.sign(
            { ...base, type: 'refresh' },
            {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.REFRESH_TTL,
            },
        );

        // Store hashed refresh token on the user document
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.userModel.findByIdAndUpdate(user._id, { refreshTokenHash: hash });

        return { accessToken, refreshToken, expiresIn: this.ACCESS_TTL };
    }

    // ── Rotate: verify old token → revoke → issue new pair ───────────────────
    async rotateRefreshToken(rawRefreshToken: string): Promise<TokenPair> {
        // 1. Verify JWT signature and expiry
        let payload: JwtPayload;
        try {
            payload = this.jwt.verify<JwtPayload>(rawRefreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token is invalid or expired');
        }

        if (payload.type !== 'refresh') {
            throw new ForbiddenException('Token type mismatch');
        }

        // 2. Load user and check they are still active
        const user = await this.userModel
            .findById(payload.sub)
            .select('+refreshTokenHash +password')
            .exec();

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or deactivated');
        }

        // 3. Compare presented token against stored hash
        if (!user.refreshTokenHash) {
            throw new UnauthorizedException('No active session found');
        }

        const isMatch = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);
        if (!isMatch) {
            // Token reuse or theft — revoke everything for this user
            await this.userModel.findByIdAndUpdate(user._id, { refreshTokenHash: null });
            throw new ForbiddenException(
                'Refresh token reuse detected. All sessions have been revoked.',
            );
        }

        // 4. Issue a new pair (automatically stores the new hash)
        return this.generateTokenPair(user);
    }

    // ── Revoke: clear the stored hash (logout) ────────────────────────────────
    async revokeToken(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }
}
