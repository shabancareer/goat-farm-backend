import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Used only on POST /auth/refresh.
 * Validates the refresh token using the separate JWT_REFRESH_SECRET.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') { }
