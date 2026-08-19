import {
    Controller, Post, Get, Patch, Delete,
    Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req, Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
    Public, Roles, RequirePermissions, CurrentUser,
} from '../../common/decorators/Rbac.decorator';
import {
    RegisterSuperOwnerDto,
    CreateUserDto,
    LoginDto,
    RefreshTokenDto,
    UpdateUserRoleDto,
    VerifyEmailDto,
    ResendVerificationDto,
} from '../../common/dto/index.dto';
import { Role, Permission } from '../../common/enums/role.enum';
import type { RequestUser } from '../../common/interfaces/jwt.interface';

@Controller('auth')
@UseGuards(RolesGuard, PermissionsGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ── Public routes (no JWT required) ──────────────────────────────────────

    /**
     * POST /auth/register
     * Called ONCE when the software is purchased.
     * Creates the Organisation + Super Owner account.
     */
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: RegisterSuperOwnerDto) {
        return this.authService.registerSuperOwner(dto);
    }

    /**
     * GET or POST /auth/verify-email
     * Verifies user email with the token sent via email.
     */
    @Public()
    @Get('verify-email')
    async verifyEmailGet(@Query() dto: VerifyEmailDto, @Res() res: Response) {
        try {
            await this.authService.verifyEmail(dto);
            return res.redirect('http://localhost:5173/auth/login?verified=true');
        } catch (error) {
            return res.redirect('http://localhost:5173/auth/login?error=invalid_token');
        }
    }

    @Public()
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    verifyEmailPost(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto);
    }

    /**
     * POST /auth/resend-verification
     * Resends email verification link to user.
     */
    @Public()
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerificationEmail(dto);
    }

    /**
     * POST /auth/login
     * Works identically for ALL roles — Super Owner, Owner, Manager, Worker, Viewer.
     * Returns: { accessToken, refreshToken, expiresIn, user }
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto, req.headers['user-agent']);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });
        return result;
    }

    /**
     * POST /auth/refresh
     * Reads refreshToken from cookie or Bearer header.
     * Sets new refreshToken cookie and returns new accessToken.
     */
    @Public()
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @CurrentUser() tokenData: { userId: string; rawToken: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.refresh(tokenData.rawToken);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return result;
    }

    // ── Protected routes ──────────────────────────────────────────────────────

    /**
     * POST /auth/logout
     * Revokes the current user's refresh token (this device only) & clears cookie.
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser() user: RequestUser,
        @Res({ passthrough: true }) res: Response,
    ) {
        res.clearCookie('refreshToken', { path: '/' });
        return this.authService.logout(user.id);
    }

    /**
     * GET /auth/me
     * Returns the authenticated user's profile and permissions.
     */
    @Get('me')
    getMe(@CurrentUser() user: RequestUser) {
        return this.authService.getMe(user.id);
    }

    // ── User management (Owner and above) ─────────────────────────────────────

    /**
     * POST /auth/users
     * Create a new user with an assigned role.
     * Owner can create: Manager, Worker, Viewer.
     * Manager can create: Worker, Viewer.
     */
    @Post('users')
    @Roles(Role.MANAGER)
    @RequirePermissions(Permission.CREATE_USER)
    createUser(
        @CurrentUser() actor: RequestUser,
        @Body() dto: CreateUserDto,
    ) {
        return this.authService.createUser(actor, dto);
    }

    /**
     * GET /auth/users
     * List all users in the same organisation.
     */
    @Get('users')
    @RequirePermissions(Permission.READ_USER)
    listUsers(@CurrentUser() actor: RequestUser) {
        return this.authService.listOrgUsers(actor);
    }

    /**
     * GET /auth/users/:id
     * Get a specific user by ID (same org only).
     */
    @Get('users/:id')
    @RequirePermissions(Permission.READ_USER)
    getUser(
        @CurrentUser() actor: RequestUser,
        @Param('id') userId: string,
    ) {
        return this.authService.getUserById(actor, userId);
    }

    /**
     * PATCH /auth/users/role
     * Change a user's role. Hierarchy rules enforced.
     */
    @Patch('users/role')
    @Roles(Role.OWNER)
    @RequirePermissions(Permission.ASSIGN_ROLE)
    updateRole(
        @CurrentUser() actor: RequestUser,
        @Body() dto: UpdateUserRoleDto,
    ) {
        return this.authService.updateUserRole(actor, dto);
    }

    /**
     * DELETE /auth/users/:id
     * Deactivates the user and revokes all their sessions.
     */
    @Delete('users/:id')
    @Roles(Role.MANAGER)
    @RequirePermissions(Permission.DELETE_USER)
    deactivateUser(
        @CurrentUser() actor: RequestUser,
        @Param('id') userId: string,
    ) {
        return this.authService.deactivateUser(actor, userId);
    }
}

