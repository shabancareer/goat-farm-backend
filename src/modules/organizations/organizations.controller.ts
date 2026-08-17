import {
    Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, Roles, RequirePermissions } from '../../common/decorators/Rbac.decorator';
import { Role, Permission } from '../../common/enums/role.enum';
import type { RequestUser } from '../../common/interfaces/jwt.interface';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SwitchOrganizationDto } from './dto/switch-organization.dto';

@Controller('organizations')
@UseGuards(RolesGuard, PermissionsGuard)
export class OrganizationsController {
    constructor(private readonly orgsService: OrganizationsService) { }

    /**
     * POST /organizations
     * Create a new organization (Super Owner only).
     */
    @Post()
    @Roles(Role.SUPER_OWNER)
    @RequirePermissions(Permission.MANAGE_ORG)
    @HttpCode(HttpStatus.CREATED)
    create(
        @CurrentUser() actor: RequestUser,
        @Body() dto: CreateOrganizationDto,
    ) {
        return this.orgsService.createOrganization(actor, dto);
    }

    /**
     * GET /organizations
     * List all accessible organizations for the user.
     */
    @Get()
    @RequirePermissions(Permission.VIEW_ORG)
    findAll(@CurrentUser() actor: RequestUser) {
        return this.orgsService.getAccessibleOrganizations(actor);
    }

    /**
     * GET /organizations/:id
     * Get specific organization by ID.
     */
    @Get(':id')
    @RequirePermissions(Permission.VIEW_ORG)
    findOne(
        @CurrentUser() actor: RequestUser,
        @Param('id') orgId: string,
    ) {
        return this.orgsService.getOrganizationById(actor, orgId);
    }

    /**
     * PATCH /organizations/:id
     * Update organization settings (Super Owner only).
     */
    @Patch(':id')
    @Roles(Role.SUPER_OWNER)
    @RequirePermissions(Permission.MANAGE_ORG)
    update(
        @CurrentUser() actor: RequestUser,
        @Param('id') orgId: string,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.orgsService.updateOrganization(actor, orgId, dto);
    }

    /**
     * POST /organizations/switch
     * Switch current active organization context (Super Owner only).
     */
    @Post('switch')
    @Roles(Role.SUPER_OWNER)
    @HttpCode(HttpStatus.OK)
    switchOrg(
        @CurrentUser() actor: RequestUser,
        @Body() dto: SwitchOrganizationDto,
    ) {
        return this.orgsService.switchOrganizationContext(actor, dto.organizationId);
    }
}
