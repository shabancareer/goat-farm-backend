import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/Rbac.decorator';
import { Permission } from '../enums/role.enum';
import { RequestUser } from '../interfaces/jwt.interface';

/**
 * Applied globally. Reads @RequirePermissions(Permission.X) from the route.
 * User must have ALL listed permissions. Super Owner bypasses.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const user: RequestUser = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('User not authenticated');
    if (user.isSuperOwner) return true;

    const missing = required.filter((p) => !user.permissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission(s): ${missing.join(', ')}`);
    }
    return true;
  }
}
