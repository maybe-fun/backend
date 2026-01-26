import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Reflector } from '@nestjs/core/services/reflector.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const admin = request.admin;

    if (!admin?.permissions) {
      throw new UnauthorizedException('Admin permissions not loaded');
    }

    const hasPermission = requiredPermissions.every((perm) =>
      admin.permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return true;
  }
}
