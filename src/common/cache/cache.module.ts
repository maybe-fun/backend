import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        });
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
