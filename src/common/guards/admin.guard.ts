import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminUser } from 'src/entities/admin-user.entity';
import { DataSource } from 'typeorm/data-source/index.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const adminUser = await this.dataSource
      .getRepository(AdminUser)
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.role', 'role')
      .where('admin.userId = :userId', { userId: user.id })
      .andWhere('admin.isActive = true')
      .getOne();

    if (!adminUser) {
      throw new UnauthorizedException('Admin access required');
    }

    /**
     * Hydrate admin context
     */
    request.admin = {
      id: adminUser.id,
      roleId: adminUser.roleId,
      permissions: adminUser.role.permissions,
    };

    return true;
  }
}
