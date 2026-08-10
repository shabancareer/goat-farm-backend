import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, Permission } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Roles(Role.MANAGER)
 * Restricts the route to users whose role level meets or exceeds the given role.
 * A Manager role also passes an Owner-level check if hierarchy allows.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @RequirePermissions(Permission.CREATE_USER)
 * Restricts the route to users who have ALL listed permissions.
 */
export const RequirePermissions = (...perms: Permission[]) =>
    SetMetadata(PERMISSIONS_KEY, perms);

/**
 * @Public()
 * Marks a route as public — JwtAuthGuard will skip it.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @CurrentUser()         → injects the full RequestUser object
 * @CurrentUser('id')     → injects just the id field
 */
export const CurrentUser = createParamDecorator(
    (field: string | undefined, ctx: ExecutionContext) => {
        const user = ctx.switchToHttp().getRequest().user;
        return field ? user?.[field] : user;
    },
);