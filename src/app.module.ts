import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration, { databaseConfiguration } from 'config';
import { join } from 'path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponserInterceptor } from './common/interceptor/response.interceptor';
import { HttpExceptionFilter } from './common/filters/exception.filter';
import { MarketsModule } from './modules/markets/markets.module';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { GuardModule } from './common/guards/guard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TopicsModule } from './modules/topics/topics.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { CommentModule } from './modules/comment/comment.module';

@Module({
  imports: [
    JwtModule,
    CacheModule,
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [configuration, databaseConfiguration],
          cache: process.env.APP_ENV === 'production',
          isGlobal: true,
        }),
      ],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        url: configService.get('DATABASE_URL'),
        synchronize: configService.get('env') === 'development',
        migrationsRun: true,
        migrations: ['dist/migrations/*{.ts,.js}'],
        logging: configService.get('env') !== 'production' ? 'all' : ['error'],
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
        ...(configService.get('DATABASE_SSL') === 'true' ||
        (configService.get('env') !== 'development' &&
          configService.get('DATABASE_SSL') !== 'false')
          ? {
              ssl: {
                rejectUnauthorized: false,
              },
            }
          : {}),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'storage/public'),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          keyPrefix: 'maybe-fun:',
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    MarketsModule,
    AuthModule,
    UserModule,
    GuardModule,
    NotificationsModule,
    WebhooksModule,
    CategoriesModule,
    TopicsModule,
    FavoriteModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponserInterceptor,
    },
  ],
})
export class AppModule {}
