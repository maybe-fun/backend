import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DefaultEventsMap, Socket } from 'socket.io';
import { UserRepository } from 'src/modules/user/user.repository';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromClient(client);
    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('auth.secret'),
      });
      client['user'] =
        await this.userRepository.findOneUserAndCreateSocketWhenNotExisting(
          client.id,
          payload.sub,
        );
    } catch {
      client.disconnect();
      return false;
    }
    return true;
  }

  private extractTokenFromClient(
    client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  ): string | undefined {
    const [type, token] =
      client.handshake.headers?.['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
