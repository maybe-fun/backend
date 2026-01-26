import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

export const AdminOnly = () =>
  applyDecorators(UseGuards(AuthGuard, AdminGuard, PermissionsGuard));
