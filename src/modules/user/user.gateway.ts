import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import configuration from 'config';
import { Socket } from 'socket.io';
import { BaseGateway } from 'src/common/base.gateway';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { UserRepository } from 'src/modules/user/user.repository';
import { UserCreatedEvent, UserEvents } from './events/user.event';

const config = configuration();
const options = {
  cors: {
    origin: config.env === 'production' ? [/panelsuite\.io$/] : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  },
};

@UseGuards(WsAuthGuard)
@WebSocketGateway(options)
export class UserGateway
  extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(UserGateway.name);
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Ws client connected: ${client.id}`);
  }

  async handleDisconnect(client: any) {
    this.logger.log(`Ws client disconnected: ${client.id}`);
    await this.userRepository.deleteSocket(client.id);
  }

  @SubscribeMessage('register')
  handleMessage(client: Socket) {
    const user = client['user'];
    client.emit('registered', { id: user.id, client_id: client.id });
    this.logger.log(
      `New ws client registered: ${client.id} for user ${user.id}`,
    );
  }

  @OnEvent(UserEvents.USER_CREATED)
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    if (!event?.user?.id) return;
    (await this.userRepository.getSockets(event?.user.id))?.forEach(
      (socket) => {
        this.getClient(socket.socket_id)?.emit(
          UserEvents.USER_CREATED,
          event.user,
        );
      },
    );
  }
}
