import { Body, Controller, Post } from '@nestjs/common';
import { EventWithMarketsCreatedPayload } from './dto/markets.dto';
import { MarketWebhookHandler } from './handlers/market-webhook.handler';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly marketWebhookHandler: MarketWebhookHandler) {}

  @Post('markets-created')
  async handleMarketCreated(@Body() payload: EventWithMarketsCreatedPayload) {
    await this.marketWebhookHandler.handleMarketCreatedWebhook(payload);
    return { ok: true };
  }
}
