import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketDraft } from 'src/entities/market-drafts.entity';
import { Market, MarketChainState } from 'src/entities/markets.entity';
import { NotificationType } from 'src/entities/notification.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { DataSource } from 'typeorm';

@Injectable()
export class MarketWebhookHandler {
  constructor(
    private dataSource: DataSource,
    private notificationService: NotificationsService,
  ) {}

  async handleMarketCreatedWebhook(payload: {
    market_id: string;
    signature_hash: string;
  }) {
    const { market_id, signature_hash } = payload;

    await this.dataSource.transaction(async (manager) => {
      const draft = await manager.findOne(MarketDraft, {
        where: {
          id: market_id,
          linked: false,
        },
      });

      if (!draft) {
        throw new NotFoundException('Market draft not found or already linked');
      }

      // 3. Create new market record
      const now = Math.floor(Date.now() / 1000);

      const market = manager.create(Market, {
        // --- Off-chain enrichment ---
        categoryId: draft.categoryId,
        topics: draft.topicIds,
        question: draft.question,
        description: draft.description,
        imageUrl: draft.imageUrl,
        resolutionCriteria: draft.resolutionCriteria,
        resolutionSource: draft.resolutionSource,

        // --- Required identifiers ---
        slug: `market-${now}`,

        // --- On-chain reference (dummy but valid) ---
        pubkey: `pubkey-${now}`,
        parentEventPubkey: `event-pubkey-${now}`,
        vaultPubkey: `vault-pubkey-${now}`,
        eventId: `event-${now}`,
        chainMarketId: now.toString(),
        bump: 255,
        creationTxSignature: `tx-signature-${signature_hash}`,

        // --- Creator ---
        creatorWallet: draft.creatorWallet,
        creatorId: draft.creatorId,

        // --- Market mechanics ---
        numOutcomes: 2,
        bValue: '1000000',
        qState: ['0', '0'],

        // --- Fees (basis points) ---
        creatorFeeBps: 200, // 2%
        protocolFeeBps: 100, // 1%

        // --- Lifecycle timestamps ---
        tradingCloseTs: draft.tradingCloseTs,
        resolutionDeadlineTs: (now + 7 * 24 * 60 * 60).toString(), // +7 days
        disputeDeadlineTs: (now + 14 * 24 * 60 * 60).toString(), // +14 days

        // --- State ---
        chainState: MarketChainState.OPEN,

        // --- Chain timestamps ---
        chainCreatedTs: now.toString(),
      });

      await manager.save(Market, market);

      await manager.update(MarketDraft, draft.id, {
        linked: true,
        linkedMarket: market,
      });

      this.notificationService.create({
        userId: draft.creatorId as string,
        type: NotificationType.MARKET_CREATED,
        title: 'Your market has been created!',
        body: `Your market "${draft.question}" is now live.`,
        marketId: market.id,
      });
    });
  }
}
