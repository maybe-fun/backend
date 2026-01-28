import { User } from 'src/entities/user.entity';

export class UserCreatedEvent {
  constructor(public readonly user: Partial<User>) {}
}

export const UserEvents = {
  USER_CREATED: 'user.created',
};
