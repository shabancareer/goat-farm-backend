import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/Rbac.decorator';
import { Role } from '../enums/role.enum';
import { meetsMinimumRole } from '../enums/Permission.matrix';
import type { RequestUser } from '../interfaces/jwt.interface';

/**
 * Applied globally. Reads @Roles(Role.X) from the route handler.
 * Passes if the user's role level >= the required minimum.
 * Super Owner always passes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user: RequestUser = context.switchToHttp().getRequest().user;

    if (!user) throw new ForbiddenException('User not authenticated');
    if (user.isSuperOwner) return true;

    // User must meet at least ONE of the required roles
    const allowed = requiredRoles.some((r) => meetsMinimumRole(user.role, r));
    if (!allowed) {
      throw new ForbiddenException(
        `Access denied. Required: ${requiredRoles.join(' or ')}. Your role: ${user.role}`,
      );
    }
    return true;
  }
}
