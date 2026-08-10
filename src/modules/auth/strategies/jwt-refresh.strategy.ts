import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtPayload } from '../../../common/interfaces/jwt.interface';

/**
 * Strategy name: 'jwt-refresh'
 * Used ONLY on POST /auth/refresh.
 * Attaches { userId, rawToken } to req.user.
 * The actual token rotation + DB check is done inside AuthService.refresh().
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService) {
        const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');

        if (!refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: refreshSecret,
            passReqToCallback: true,
        });
    }

    async validate(
        req: Request,
        payload: JwtPayload,
    ) {
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException(
                'Not a refresh token',
            );
        }

        const rawToken =
            req.headers.authorization?.replace(
                'Bearer ',
                '',
            ) ?? '';

        return {
            userId: payload.sub,
            rawToken,
        };
    }
}
