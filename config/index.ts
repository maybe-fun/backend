import * as process from 'process';

export default function configuration() {
  return {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.APP_ENV,
    url: process.env.BASE_URL,
    name: process.env.APP_NAME ?? 'Maybe-fun',
    client: { url: process.env.CLIENT_URL },
    auth: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      // db: process.env.REDIS_DB,
      password: process.env.REDIS_PASSWORD,
    },
    mail: {
      from: process.env.MAIL_FROM,
      from_name: process.env.MAIL_FROM_NAME,
    },
  };
}

export * from './database.config';
export { dataSource } from '../database/data-source';
export { config } from '../database/data-source';
export { env } from '../database/data-source';
