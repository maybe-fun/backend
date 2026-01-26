import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class GuardModule {}
