import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, RequirePermissions } from '../../common/decorators/Rbac.decorator';
import { Permission } from '../../common/enums/role.enum';
import type { RequestUser } from '../../common/interfaces/jwt.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * PATCH /users/profile
     * Update current authenticated user's profile information.
     */
    @Patch('profile')
    updateProfile(
        @CurrentUser() actor: RequestUser,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(actor, dto);
    }

    /**
     * GET /users
     * List all users/employees within the active organization.
     */
    @Get()
    @RequirePermissions(Permission.READ_USER)
    listUsers(@CurrentUser() actor: RequestUser) {
        return this.usersService.listOrgUsers(actor);
    }
}
