import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketDraft } from 'src/entities/market-drafts.entity';
import { MarketOption } from 'src/entities/market-option.entity';
import { MarketStats } from 'src/entities/market-stats.entity';
import { MarketTopic } from 'src/entities/market-topic.entity';
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
      // 1. Lock & validate draft
      const draft = await manager.findOne(MarketDraft, {
        where: { id: market_id, linked: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!draft) {
        throw new NotFoundException('Market draft not found or already linked');
      }

      const now = Math.floor(Date.now() / 1000);

      // 2. Create Market
      const market = manager.create(Market, {
        categoryId: draft.categoryId,
        question: draft.question,
        description: draft.description,
        imageUrl: draft.imageUrl,
        resolutionCriteria: draft.resolutionCriteria,
        resolutionSource: draft.resolutionSource,

        slug: `market-${now}`,

        // --- On-chain references ---
        pubkey: `pubkey-${now}`,
        parentEventPubkey: `event-pubkey-${now}`,
        vaultPubkey: `vault-pubkey-${now}`,
        eventId: `event-${now}`,
        chainMarketId: now.toString(),
        bump: 255,
        creationTxSignature: `tx-signature-${signature_hash}`,

        // --- Creator ---
        creatorId: draft.creatorId,
        creatorWallet: draft.creatorWallet,

        // --- Market mechanics ---
        numOutcomes: 2,
        bValue: '1000000',
        qState: ['0', '0'],

        // --- Fees ---
        creatorFeeBps: 200,
        protocolFeeBps: 100,

        // --- Lifecycle ---
        tradingCloseTs: draft.tradingCloseTs,
        resolutionDeadlineTs: (now + 7 * 86400).toString(),
        disputeDeadlineTs: (now + 14 * 86400).toString(),

        chainState: MarketChainState.OPEN,
        chainCreatedTs: now.toString(),
      });

      await manager.save(market);

      // 3. Create MarketStats (always 1:1)
      await manager.insert(MarketStats, {
        marketId: market.id,
      });

      // 4. Link Topics (max 3 already enforced upstream)
      if (draft.topicIds?.length) {
        await manager.insert(
          MarketTopic,
          draft.topicIds.map((topicId) => ({
            marketId: market.id,
            topicId,
          })),
        );
      }

      // 5. Create Market Options (YES / NO)
      await manager.insert(MarketOption, [
        {
          marketId: market.id,
          outcomeIndex: 0,
          outcomeMintPubkey: `mint-${now}-yes`,
          name: 'YES',
          currentProbability: '0.50000000',
          currentPriceCents: 50,
        },
        {
          marketId: market.id,
          outcomeIndex: 1,
          outcomeMintPubkey: `mint-${now}-no`,
          name: 'NO',
          currentProbability: '0.50000000',
          currentPriceCents: 50,
        },
      ]);

      // 6. Mark draft as linked
      await manager.update(MarketDraft, draft.id, {
        linked: true,
        linkedMarket: market,
      });

      // 7. Notify creator
      await this.notificationService.create({
        userId: draft.creatorId as string,
        type: NotificationType.MARKET_CREATED,
        title: 'Your market has been created!',
        body: `Your market "${draft.question}" is now live.`,
        marketId: market.id,
        manager,
      });
    });
  }
}
