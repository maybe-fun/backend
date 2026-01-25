import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from 'src/entities/user.entity';
import { UserSession } from 'src/entities/user-session.entity';
import { UserBalance } from 'src/entities/user-balance.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from 'src/entities/admin-user.entity';
import { AdminAction } from 'src/entities/admin-action.entity';
import { AdminRole } from 'src/entities/admin-role.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSession,
      UserBalance,
      AdminUser,
      AdminAction,
      AdminRole,
    ]),
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
