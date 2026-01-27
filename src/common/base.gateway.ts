import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export class BaseGateway {
  @WebSocketServer() private server: Server;

  protected getClient(key: string) {
    return this.server.sockets.sockets.get(key);
  }
}
