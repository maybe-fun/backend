import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as express from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import configuration from 'config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = configuration();
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: '*',
  });
  app.use(express.urlencoded({ extended: true }));
  app.useBodyParser('json', { limit: '10mb' });

  const port = config.port ?? 5000;
  console.log('Listening on: ', `http://0.0.0.0:${port}`);
  await app.listen(port);
}
bootstrap();
