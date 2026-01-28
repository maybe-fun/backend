import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { UserStatus } from 'src/entities/user.entity';
import { UserRepository } from 'src/modules/user/user.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  private logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('auth.secret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException(
          `Your account is ${user.status}. Please contact support.`,
        );
      }

      const currentSession = await this.userRepository.getSessionByJti(
        payload.jti,
      );
      if (
        !currentSession ||
        currentSession.expiresAt < new Date() ||
        currentSession.revokedAt
      ) {
        throw new UnauthorizedException(
          'Session has expired or been revoked. Please log in again.',
        );
      }

      request.user = instanceToPlain(user);
      request.user.jti = payload.jti;
      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new UnauthorizedException(error.message || 'Unauthorized');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
