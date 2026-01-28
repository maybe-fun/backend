import { DataSource, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserSocket } from 'src/entities/user-socket.entity';
import { UserSession } from 'src/entities/user-session.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private datasource: DataSource) {
    super(User, datasource.createEntityManager());
  }

  async findOneUserAndCreateSocketWhenNotExisting(
    socket_id: string,
    user_id: string,
  ) {
    const user = await this.findOne({
      where: { id: user_id },
      relations: ['sockets'],
    });

    if (!user) {
      return null;
    }

    if (user.sockets.find((socket) => socket.socket_id === socket_id)) {
      return user;
    }

    const socket = await this.datasource.getRepository(UserSocket).save({
      user: { id: user.id },
      socket_id,
    });

    user.sockets.push(socket);
    return user;
  }

  async deleteSocket(socket_id: string) {
    const socket = await this.datasource
      .getRepository(UserSocket)
      .findOneBy({ socket_id });
    if (!socket) return;
    await this.datasource.getRepository(UserSocket).remove(socket);
  }

  getSockets(id: string) {
    return this.datasource
      .getRepository(UserSocket)
      .find({ where: { user: { id } } });
  }

  getSessionByJti(jti: string) {
    return this.datasource
      .getRepository(UserSession)
      .findOne({ where: { jti } });
  }
}
