import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { MarketWebhookHandler } from './handlers/market-webhook.handler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, MarketWebhookHandler],
})
export class WebhooksModule {}
