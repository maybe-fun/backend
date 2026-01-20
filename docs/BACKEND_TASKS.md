# Maybe.Fun Backend - Developer Task Document

## Overview

This document provides detailed implementation tasks for the Maybe.Fun prediction market backend. The backend serves as the bridge between the Solana smart contract (via Helius webhooks) and the frontend application.

**Tech Stack:** NestJS, TypeScript, TypeORM, PostgreSQL, Redis

**Smart Contract:** Source of truth for all on-chain data
**Program ID:** `5JpYHw8ZbxiAUUnzjARsP2GYKCJpbucqenVmqoVyKig9`

**Data Flow:**
```
Solana Contract → Helius Webhook → Backend → PostgreSQL
                                          → Redis (Cache)
                                          → WebSocket → Frontend
```

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Database Schema](#2-database-schema)
3. [Helius Webhook Integration](#3-helius-webhook-integration)
4. [REST API Endpoints](#4-rest-api-endpoints)
5. [WebSocket Gateway](#5-websocket-gateway)
6. [Redis Integration](#6-redis-integration)
7. [Background Jobs](#7-background-jobs)
8. [Admin Module](#8-admin-module)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment](#10-deployment)

---

## 1. Project Setup

### 1.1 Initialize NestJS Project

```bash
nest new backend
cd backend
```

### 1.2 Install Required Dependencies

```bash
# Core
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/bull bull
npm install @nestjs/schedule
npm install @nestjs/event-emitter
npm install ioredis @nestjs/cache-manager cache-manager cache-manager-ioredis-yet

# Solana
npm install @solana/web3.js @coral-xyz/anchor bs58

# Validation & Utils
npm install class-validator class-transformer
npm install uuid
npm install helmet
npm install @nestjs/throttler

# Dev
npm install -D @types/bull @types/passport-jwt
```

### 1.3 Module Structure

```
src/
├── app.module.ts
├── main.ts
├── config/
│   ├── configuration.ts
│   ├── database.config.ts
│   └── redis.config.ts
├── common/
│   ├── decorators/
│   │   ├── wallet-auth.decorator.ts
│   │   └── admin.decorator.ts
│   ├── guards/
│   │   ├── wallet-auth.guard.ts
│   │   └── admin.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── utils/
│       ├── lmsr.util.ts
│       └── pagination.util.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── markets/
│   │   ├── markets.module.ts
│   │   ├── markets.controller.ts
│   │   ├── markets.service.ts
│   │   └── dto/
│   ├── trading/
│   │   ├── trading.module.ts
│   │   ├── trading.controller.ts
│   │   └── trading.service.ts
│   ├── portfolio/
│   │   ├── portfolio.module.ts
│   │   ├── portfolio.controller.ts
│   │   └── portfolio.service.ts
│   ├── leaderboard/
│   │   ├── leaderboard.module.ts
│   │   ├── leaderboard.controller.ts
│   │   └── leaderboard.service.ts
│   ├── referrals/
│   │   ├── referrals.module.ts
│   │   ├── referrals.controller.ts
│   │   └── referrals.service.ts
│   ├── charts/
│   │   ├── charts.module.ts
│   │   ├── charts.controller.ts
│   │   └── charts.service.ts
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   ├── helius-webhook.controller.ts
│   │   ├── helius-webhook.service.ts
│   │   ├── base-webhook.handler.ts
│   │   └── handlers/
│   │       ├── event-created.handler.ts
│   │       ├── market-created.handler.ts
│   │       ├── trade-executed.handler.ts
│   │       ├── resolution-proposed.handler.ts
│   │       ├── dispute-opened.handler.ts
│   │       ├── admin-resolved.handler.ts
│   │       ├── uncontested-finalized.handler.ts
│   │       ├── winnings-redeemed.handler.ts
│   │       ├── creator-fees.handler.ts
│   │       └── protocol-withdrawn.handler.ts
│   ├── websocket/
│   │   ├── websocket.module.ts
│   │   ├── websocket.gateway.ts
│   │   └── websocket.service.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   └── admin.service.ts
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   └── notifications.service.ts
│   └── jobs/
│       ├── jobs.module.ts
│       ├── price-aggregation.job.ts
│       ├── leaderboard-snapshot.job.ts
│       ├── market-lifecycle.job.ts
│       └── stats-aggregation.job.ts
├── entities/
│   └── [all TypeORM entities]
└── migrations/
    └── [TypeORM migrations]
```

---

## 2. Database Schema

### 2.1 Reference Schema

**IMPORTANT:** The complete database schema is defined in [https://dbdiagram.io/d/MAYBE-FUN-COMPLETE-DATABASE-SCHEMA-695e2c6b39fa3db27b5500c8](https://dbdiagram.io/d/MAYBE-FUN-COMPLETE-DATABASE-SCHEMA). Use this as the **source of truth** for all TypeORM entity creation.

The schema includes:
- 40+ tables with full column definitions
- Data source markers: 🔗 Chain-mirrored, 💾 Off-chain, 🔄 Hybrid
- Indexes and relationships
- Notes on each table's purpose

### 2.2 Implementation Phases

**Phase 1 - Core:**

| Entity | Table | Description |
|--------|-------|-------------|
| User | `users` | User identity, wallet address primary key |
| UserSession | `user_sessions` | Wallet-based auth sessions |
| ChainEvent | `chain_events` | On-chain Event accounts (parent of markets) |
| Market | `markets` | Market accounts with LMSR state |
| MarketOption | `market_options` | YES/NO options with probabilities |
| Trade | `trades` | TradeExecuted events |
| ChainPosition | `chain_positions` | On-chain Position accounts |
| Position | `positions` | Computed positions with P&L |

**Phase 2 - Extended:**

| Entity | Table | Description |
|--------|-------|-------------|
| PriceSnapshot | `price_snapshots` | OHLC candle data |
| ChainDispute | `chain_disputes` | On-chain Dispute accounts |
| Resolution | `resolutions` | Resolution proposals |
| Dispute | `disputes` | Off-chain dispute details |
| Payout | `payouts` | WinningsRedeemed events |
| Transaction | `transactions` | Complete financial ledger |
| UserBalance | `user_balances` | User balance tracking |
| UserStats | `user_stats` | Materialized user statistics |

**Phase 3 - Social & Admin:**

| Entity | Table | Description |
|--------|-------|-------------|
| Category | `categories` | Market categories |
| Topic | `topics` | Market topics |
| MarketTopic | `market_topics` | Junction table |
| Referral | `referrals` | Referral tracking |
| ReferralStats | `referral_stats` | Aggregated referral stats |
| Notification | `notifications` | User notifications |
| Comment | `comments` | Market comments |
| Favorite | `favorites` | Favorited markets |
| AdminRole | `admin_roles` | Admin role definitions |
| AdminUser | `admin_users` | Admin assignments |
| AdminAction | `admin_actions` | Audit trail |

### 2.3 Key Entity Implementation Notes

#### Market Entity (Critical Fields)

```typescript
@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // On-chain reference - MUST mirror exactly
  @Column({ type: 'varchar', length: 44, unique: true })
  pubkey: string;  // Market PDA address

  @Column({ type: 'varchar', length: 64 })
  eventId: string;  // Used in PDA derivation

  @Column({ type: 'bigint' })
  chainMarketId: string;  // 0..n-1 per event

  @Column({ type: 'jsonb' })
  qState: string[];  // LMSR state vector [q0, q1]

  @Column({ type: 'bigint' })
  bValue: string;  // LMSR liquidity parameter

  @Column({
    type: 'enum',
    enum: ['open', 'trading_closed', 'proposed_resolution', 'disputed', 'finalized', 'canceled'],
  })
  chainState: string;  // MUST match MarketState exactly

  @Column({ type: 'bigint' })
  tradingCloseTs: string;

  @Column({ type: 'bigint' })
  resolutionDeadlineTs: string;

  @Column({ type: 'bigint' })
  disputeDeadlineTs: string;

  @Column({ type: 'smallint', nullable: true })
  resolvedOutcome: number;  // 0=YES, 1=NO, null if unresolved
}
```

#### Trade Entity (From TradeExecuted Event)

```typescript
@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 88, unique: true })
  txSignature: string;  // Solana transaction signature

  @Column({ type: 'varchar', length: 44 })
  marketPubkey: string;  // Market PDA from event

  @Column({ type: 'varchar', length: 44 })
  traderWallet: string;  // Trader wallet from event

  @Column({ type: 'int' })
  outcomeIndex: number;  // 0=YES, 1=NO

  @Column({ type: 'boolean' })
  isBuy: boolean;  // true=buy, false=sell

  @Column({ type: 'bigint' })
  size: string;  // Share count

  @Column({ type: 'bigint' })
  cost: string;  // USDC amount (6 decimals)

  @Column({ type: 'bigint' })
  tradeTs: string;  // On-chain timestamp
}
```

---

## 3. Helius Webhook Integration

### 3.1 Webhook Controller Setup

```
POST /webhooks/helius

1. Extract signature from x-helius-signature header
2. Verify HMAC-SHA256 signature against raw body
3. If invalid → 401 Unauthorized
4. Queue events for async processing (Bull queue)
5. Return 200 immediately (don't block webhook)
```

### 3.1.1 Helius Signature Verification (CRITICAL)

Helius uses HMAC-SHA256 to sign webhook payloads. The signature is sent in the `x-helius-signature` header.

```
verifySignature(signature, rawBody, secret):
  1. Compute expected = HMAC-SHA256(secret, rawBody) → base64
  2. Use timing-safe comparison (prevent timing attacks)
  3. Return true if signature === expected
```

**IMPORTANT:** Use raw body middleware to preserve exact payload:
- Configure `express.json()` with `verify` callback to store `req.rawBody`
- Use `req.rawBody` for signature verification, NOT re-serialized JSON

### 3.2 Event Handlers (11 Total)

**IMPORTANT:** The smart contract emits 11 distinct events. Market closing (`Open` → `TradingClosed`) is a state transition triggered by on-chain instructions but does NOT emit a named event - handle via background job (see Section 7.3).

| # | Event Name | Handler File | Event Fields | DB Tables Updated | Priority |
|---|------------|--------------|--------------|-------------------|----------|
| 1 | `EventWithMarketsCreated` | `event-created.handler.ts` | `event`, `event_id`, `creator`, `num_markets`, `created_ts` | `chain_events` | P0 |
| 2 | `MarketCreated` | `market-created.handler.ts` | `market`, `market_id`, `parent_event`, `creator` | `markets`, `market_options` | P0 |
| 3 | `TradeExecuted` | `trade-executed.handler.ts` | `market`, `trader`, `outcome`, `size`, `cost`, `is_buy`, `ts` | `trades`, `positions`, `markets`, `price_snapshots` | P0 |
| 4 | `ResolutionProposed` | `resolution-proposed.handler.ts` | `market`, `proposer`, `outcome`, `proposed_ts` | `markets`, `resolutions` | P0 |
| 5 | `DisputeOpened` | `dispute-opened.handler.ts` | `market`, `disputer`, `bond_amount`, `created_ts` | `markets`, `chain_disputes`, `disputes` | P0 |
| 6 | `AdminResolved` | `admin-resolved.handler.ts` | `market`, `final_outcome`, `dispute_wins`, `bond` | `markets`, `chain_disputes` | P0 |
| 7 | `UncontestedFinalized` | `uncontested-finalized.handler.ts` | `market`, `resolved_outcome` | `markets` | P0 |
| 8 | `WinningsRedeemed` | `winnings-redeemed.handler.ts` | `market`, `user`, `outcome`, `shares`, `payout` | `payouts`, `positions`, `user_balances` | P0 |
| 9 | `CreatorFeesWithdrawn` | `creator-fees.handler.ts` | `market`, `creator`, `amount` | `markets`, `transactions` | P1 |
| 10 | `ProtocolUsdcWithdrawn` | `protocol-withdrawn.handler.ts` | `admin`, `amount` | `admin_actions` | P2 |
| 11 | `ProtocolSolWithdrawn` | `protocol-withdrawn.handler.ts` | `admin`, `lamports` | `admin_actions` | P2 |

### 3.2.1 Fee Timing Clarification

**CRITICAL:** Understand when fees are charged:

| Fee Type | When Charged | Event | Calculation |
|----------|--------------|-------|-------------|
| **Protocol Fee** | On every trade | `TradeExecuted` | `cost` includes fee for buys; fee deducted from payout for sells |
| **Creator Fee** | On redemption only | `WinningsRedeemed` | `payout = shares - (shares × creator_fee_bps / 10000)` |

The `TradeExecuted.cost` field semantics:
- **Buy:** `cost = LMSR_base_cost + protocol_fee` (user pays this amount)
- **Sell:** `cost = LMSR_payout - protocol_fee` (user receives this amount)

### 3.2.2 Idempotency Requirements

**All handlers MUST check for duplicate events before processing.** Helius may retry webhooks on failure.

```
BaseWebhookHandler.handle(event, txContext):
  1. Check if tx_signature exists in target table
  2. If exists → log warning, return early (idempotent)
  3. Otherwise → call processEvent(event, txContext)
```

**Tables requiring unique `tx_signature` constraint:**
- `trades` ✅ (already defined)
- `payouts` ✅ (already defined)
- `chain_events` ⚠️ **ADD unique constraint**
- `chain_disputes` ⚠️ **ADD unique constraint**
- `resolutions` ⚠️ **ADD `resolution_tx_signature` column with unique constraint**

### 3.3 Handler Template (TradeExecuted - Most Complex)

```
TradeExecutedHandler.processEvent(event, txContext):

  1. FIND MARKET
     - Lookup market by pubkey with options relation
     - Throw if not found

  2. CREATE TRADE RECORD
     - Insert into trades table with tx_signature, market, trader, outcome, size, cost, is_buy
     - Calculate pricePerShare = cost / size / 1e6

  3. SYNC Q-STATE FROM CHAIN (CRITICAL)
     - TradeExecuted event does NOT include new q values
     - Fetch Market account via RPC: solanaService.fetchMarketAccount(pubkey)
     - Update market.qState from chain response
     - Recalculate probabilities using LMSR formula (see Appendix D)

  4. UPDATE MARKET STATS
     - totalVolume += cost / 1e6
     - totalTrades += 1

  5. UPDATE USER POSITION (derived from trade, not chain)
     - Find or create position for user/market/outcome
     - If buy: newShares = current + size, newCost = current + cost
     - If sell: newShares = current - size, calculate realizedPnl
     - Update averageEntryPrice = totalCost / shares

  6. INVALIDATE CACHE
     - Delete: market:{slug}, market:{pubkey}, portfolio:{trader}

  7. EMIT WEBSOCKET EVENTS
     - To market channel: trade event with new probabilities
     - To user channel: position_update event
```

**Position Update Logic (Sell Case):**
```
avgCostPerShare = totalCost / currentShares
costBasis = avgCostPerShare × size
realizedPnl = sellPayout - costBasis
remainingCost = totalCost × (newShares / currentShares)
```

### 3.4 Event Processing Queue

**Module Setup:**
- Register Bull queue: `webhook-processing`
- Register all 11 event handlers (market closing handled by cron, not webhook)

```
WebhookProcessor.processEvent(job):
  1. Extract eventName, eventData, txContext from job
  2. Lookup handler by eventName
  3. Try: handler.handle(eventData, txContext)
  4. Catch: Log to goldsky_failed_events, re-throw for Bull retry
```

---

## 4. REST API Endpoints

### 4.1 Authentication Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/challenge` | Get signing challenge | No |
| POST | `/api/v1/auth/verify` | Verify signature, issue JWT | No |
| POST | `/api/v1/auth/refresh` | Refresh token | No |
| POST | `/api/v1/auth/logout` | Revoke session | Yes |

**Challenge Request:**
```typescript
{ walletAddress: string }
```

**Challenge Response:**
```typescript
{
  nonce: string,
  message: string,  // "Sign this message to authenticate: {nonce}"
  expiresAt: string
}
```

**Verify Request:**
```typescript
{
  walletAddress: string,
  signature: string,
  nonce: string
}
```

**Verify Response:**
```typescript
{
  accessToken: string,
  refreshToken: string,
  user: UserResponse
}
```

### 4.2 Markets Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/markets` | List markets with filters | No |
| GET | `/api/v1/markets/trending` | Trending markets | No |
| GET | `/api/v1/markets/closing-soon` | Markets closing in 24h | No |
| GET | `/api/v1/markets/:slug` | Market detail by slug | No |
| GET | `/api/v1/markets/:slug/trades` | Market trade history | No |
| GET | `/api/v1/markets/:slug/positions` | Position holders | No |
| POST | `/api/v1/markets/:pubkey/metadata` | Update metadata | Yes (Creator) |

**Query Parameters for GET /markets:**
```typescript
{
  page?: number,           // Default: 1
  limit?: number,          // Default: 20, Max: 50
  category?: string,       // Category slug
  topic?: string,          // Topic slug
  state?: 'open' | 'trading_closed' | 'proposed_resolution' | 'disputed' | 'finalized',
  sortBy?: 'volume' | 'trades' | 'created' | 'closing',
  sortOrder?: 'asc' | 'desc',
  search?: string,         // Full-text search on question
  creator?: string,        // Wallet address
}
```

**Market List Response:**
```typescript
{
  data: [{
    pubkey: string,
    slug: string,
    question: string,
    imageUrl: string,
    category: { id: string, name: string, slug: string },
    chainState: string,
    yesProbability: number,
    noProbability: number,
    totalVolume: number,
    totalTrades: number,
    tradingCloseTs: string,
    createdAt: string,
  }],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
  }
}
```

**Market Detail Response:**
```typescript
{
  pubkey: string,
  slug: string,
  eventId: string,
  question: string,
  description: string,
  imageUrl: string,
  resolutionCriteria: string,
  resolutionSource: string,
  category: { id: string, name: string, slug: string },
  topics: [{ id: string, name: string, slug: string }],
  creator: {
    walletAddress: string,
    username: string,
    avatarUrl: string,
  },
  options: [{
    id: string,
    outcomeIndex: number,
    name: string,  // "YES" or "NO"
    currentProbability: number,
    currentPriceCents: number,
    outcomeMintPubkey: string,
  }],
  chainState: string,
  tradingCloseTs: string,
  resolutionDeadlineTs: string,
  disputeDeadlineTs: string,
  resolvedOutcome: number | null,
  disputed: boolean,
  totalVolume: number,
  totalTrades: number,
  uniqueTraders: number,
  vaultPubkey: string,
  bValue: string,
  qState: string[],
  creatorFeeBps: number,
  protocolFeeBps: number,
  createdAt: string,
}
```

### 4.3 Trading Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/trading/quote` | Get trade quote | No |
| POST | `/api/v1/trading/validate` | Pre-trade validation | No |
| GET | `/api/v1/trading/markets/:pubkey/orderbook` | Current market state | No |

**NOTE:** Trade execution happens on-chain via the frontend wallet. The backend only records trades via webhooks. The `/validate` endpoint provides pre-flight checks before the user signs.

**Trade Validation Request:**
```typescript
{
  marketPubkey: string,
  outcomeIndex: number,    // 0=YES, 1=NO
  size: string,            // Shares to buy/sell
  isBuy: boolean,
  userWallet: string,      // For balance/position checks
}
```

**Trade Validation Response:**
```typescript
{
  valid: boolean,
  errors: string[],        // ["Market is closed", "Insufficient shares to sell"]
  warnings: string[],      // ["High price impact (>5%)"]
  marketState: string,     // Current chain state
  estimatedCost: string,   // USDC (6 decimals)
  estimatedFee: string,    // Protocol fee portion
  priceImpact: number,     // Percentage (0.05 = 5%)
  currentProbability: number,
  newProbability: number,
  userBalance?: string,    // If authenticated
  userShares?: string,     // Current shares for this outcome
}
```

**Trade Quote Request:**
```typescript
{
  marketPubkey: string,
  outcomeIndex: number,  // 0=YES, 1=NO
  size: string,          // Shares to buy/sell (as string for precision)
  isBuy: boolean,
}
```

**Trade Quote Response:**
```typescript
{
  baseCost: string,       // USDC (6 decimals)
  fee: string,            // Protocol fee
  totalCost: string,      // baseCost + fee (for buys) or baseCost - fee (for sells)
  pricePerShare: number,  // 0-1
  priceImpact: number,    // Percentage change in price
  newProbability: number, // Probability after trade
}
```

**Orderbook Response:**
```typescript
{
  yesProbability: number,
  noProbability: number,
  yesPrice: number,
  noPrice: number,
  liquidity: string,
  qState: string[],
}
```

### 4.4 Portfolio Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/portfolio` | User portfolio summary | Yes |
| GET | `/api/v1/portfolio/positions/:id` | Position detail | Yes |
| GET | `/api/v1/portfolio/transactions` | Transaction history | Yes |
| GET | `/api/v1/portfolio/pnl-history` | P&L over time | Yes |

**Portfolio Response:**
```typescript
{
  summary: {
    totalValue: number,
    totalPnl: number,
    openPositions: number,
    closedPositions: number,
  },
  positions: [{
    id: string,
    market: {
      pubkey: string,
      slug: string,
      question: string,
      chainState: string,
    },
    outcomeIndex: number,
    outcomeName: string,
    shares: string,
    averageEntryPrice: number,
    currentPrice: number,
    unrealizedPnl: number,
    isActive: boolean,
  }]
}
```

### 4.5 Charts Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/charts/:marketPubkey/:outcomeIndex` | OHLC candles | No |

**Query Parameters:**
```typescript
{
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
  from?: string,   // ISO timestamp
  to?: string,     // ISO timestamp
}
```

**Response:**
```typescript
{
  candles: [{
    time: string,      // ISO timestamp
    open: number,      // Probability 0-1
    high: number,
    low: number,
    close: number,
    volume: number,    // USDC
    trades: number,
  }]
}
```

### 4.6 Leaderboard Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/leaderboard` | Leaderboard rankings | No |
| GET | `/api/v1/leaderboard/top-wins` | Biggest wins | No |

**Query Parameters:**
```typescript
{
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time',
  metric?: 'pnl' | 'volume' | 'trades' | 'win_rate',
  page?: number,
  limit?: number,
}
```

**Response:**
```typescript
{
  data: [{
    rank: number,
    user: {
      walletAddress: string,
      username: string,
      avatarUrl: string,
    },
    profitLoss: number,
    volume: number,
    trades: number,
    winRate: number,
  }],
  meta: { page, limit, total, totalPages }
}
```

### 4.7 Users Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/me` | Current user profile | Yes |
| PATCH | `/api/v1/users/me` | Update profile | Yes |
| GET | `/api/v1/users/:wallet` | Public profile | No |
| GET | `/api/v1/users/:wallet/stats` | User stats | No |
| GET | `/api/v1/users/:wallet/trades` | User trades | No |

### 4.8 Referrals Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/referrals` | Referral stats | Yes |
| POST | `/api/v1/referrals/apply` | Apply referral code | Yes |

**Referral Stats Response:**
```typescript
{
  referralCode: string,
  referralLink: string,
  totalReferrals: number,
  activeReferrals: number,
  totalRewards: string,
  pendingRewards: string,
  referees: [{
    walletAddress: string,
    username: string,
    status: string,
    joinedAt: string,
  }]
}
```

### 4.9 Notifications Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/notifications` | User notifications | Yes |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | Yes |
| POST | `/api/v1/notifications/read-all` | Mark all read | Yes |
| GET | `/api/v1/notifications/unread-count` | Unread count | Yes |

### 4.10 Categories & Topics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/categories` | List categories | No |
| GET | `/api/v1/topics` | List topics | No |

---

## 5. WebSocket Gateway

### 5.1 Gateway Setup

```
WebSocket namespace: /ws
Transport: websocket only
CORS: configured per environment

Messages:
  subscribe({ channel }) → client.join(channel) → { success: true }
  unsubscribe({ channel }) → client.leave(channel) → { success: true }
  auth({ token }) → verify JWT → client.join(user:{wallet}) → { success: true/false }
```

### 5.2 Channel Structure

| Channel | Description | Events |
|---------|-------------|--------|
| `market:{pubkey}` | Market-specific updates | `trade`, `price_update`, `state_change` |
| `markets` | Global market events | `new_market`, `market_update` |
| `user:{wallet}` | User-specific (auth required) | `position_update`, `payout`, `notification` |
| `leaderboard` | Leaderboard updates | `ranking_update` |

### 5.3 Event Payloads

**Trade Event (market:{pubkey}):**
```typescript
{
  type: 'trade',
  data: {
    txSignature: string,
    trader: string,
    outcomeIndex: number,
    isBuy: boolean,
    size: string,
    cost: string,
    timestamp: string,
    newYesProbability: number,
    newNoProbability: number,
    pricePerShare: number,
  }
}
```

**Price Update Event (market:{pubkey}):**
```typescript
{
  type: 'price_update',
  data: {
    yesProbability: number,
    noProbability: number,
    yesPrice: number,
    noPrice: number,
    qState: string[],
  }
}
```

**State Change Event (market:{pubkey}):**
```typescript
{
  type: 'state_change',
  data: {
    previousState: string,
    newState: string,
    timestamp: string,
    details?: {
      proposedOutcome?: number,
      resolvedOutcome?: number,
      disputer?: string,
    }
  }
}
```

**New Market Event (markets):**
```typescript
{
  type: 'new_market',
  data: MarketListItemResponse
}
```

**Position Update Event (user:{wallet}):**
```typescript
{
  type: 'position_update',
  data: {
    marketPubkey: string,
    marketSlug: string,
    outcomeIndex: number,
    shares: string,
    averageEntryPrice: number,
    unrealizedPnl: number,
  }
}
```

**Payout Event (user:{wallet}):**
```typescript
{
  type: 'payout',
  data: {
    marketPubkey: string,
    marketSlug: string,
    outcomeIndex: number,
    sharesRedeemed: string,
    payoutAmount: string,
    txSignature: string,
  }
}
```

**Notification Event (user:{wallet}):**
```typescript
{
  type: 'notification',
  data: NotificationResponse
}
```

---

## 6. Redis Integration

### 6.1 Cache Keys & TTLs

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `market:slug:{slug}` | 60s | Market detail by slug |
| `market:pubkey:{pubkey}` | 60s | Market detail by pubkey |
| `markets:list:{hash}` | 30s | Filtered market list (hash of query params) |
| `markets:trending:{timeframe}` | 60s | Trending markets |
| `markets:closing-soon` | 60s | Markets closing soon |
| `user:profile:{wallet}` | 300s | User profile |
| `user:stats:{wallet}` | 120s | User statistics |
| `portfolio:{wallet}` | 60s | User portfolio |
| `leaderboard:{period}:{metric}` | 300s | Leaderboard data |
| `ohlc:{pubkey}:{outcome}:{interval}:{date}` | 86400s* | OHLC candles |
| `auth:nonce:{wallet}` | 300s | Auth challenge nonce |

*86400s for completed candles, 10s for current candle

### 6.2 Cache Service

```
CacheService methods:
  get(key) → JSON.parse(redis.get(key)) or null
  set(key, value, ttl?) → redis.setex(key, ttl, JSON.stringify(value))
  del(key) → redis.del(key)
  delPattern(pattern) → redis.keys(pattern) → redis.del(...keys)
  getOrSet(key, factory, ttl) → cache-aside pattern (get or compute+store)
```

### 6.3 Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Public APIs | 100 req | 1 min |
| Auth APIs | 10 req | 1 min |
| Authenticated APIs | 200 req | 1 min |
| Webhook | 1000 req | 1 min |

```
RateLimitGuard.canActivate():
  1. Extract IP and endpoint from request
  2. Check rate limit: rateLimitService.check(ip, endpoint, limit, window)
  3. If limited → throw ThrottlerException
  4. Return true
```

### 6.4 Pub/Sub for WebSocket Scaling

```
RedisWebSocketAdapter (for multi-instance scaling):

  onModuleInit():
    - subscriber.psubscribe('ws:*')
    - On message: extract channel, parse {event, data}, emit to WebSocket room

  publish(channel, event, data):
    - publisher.publish('ws:' + channel, JSON.stringify({event, data}))
```

---

## 7. Background Jobs

### 7.1 Price Aggregation Job (OHLC Candles)

**Schedules:**
- 1m candles: every minute
- 5m candles: every 5 minutes
- 1h candles: every hour
- 1d candles: daily at midnight UTC

```
aggregateCandles(interval, windowSecs):
  1. Calculate bucket boundaries (previousBucket, bucketStart)
  2. For each active market option:
     a. Query trades in previous bucket window
     b. If no trades:
        - Create flat candle using previous close price
     c. If trades exist:
        - open = first trade price
        - high = max(prices)
        - low = min(prices)
        - close = last trade price
        - volume = sum(costs) / 1e6
     d. Upsert to price_snapshots (idempotent on optionId + interval + bucketTime)
```

### 7.2 Leaderboard Snapshot Job

```typescript
// src/modules/jobs/leaderboard-snapshot.job.ts
@Injectable()
export class LeaderboardSnapshotJob {
  @Cron('0 0 0 * * *')  // Daily at midnight
  async createDailySnapshot() {
    await this.createSnapshot('daily');
  }

  @Cron('0 0 0 * * 0')  // Weekly on Sunday
  async createWeeklySnapshot() {
    await this.createSnapshot('weekly');
  }

  @Cron('0 0 0 1 * *')  // Monthly on 1st
  async createMonthlySnapshot() {
    await this.createSnapshot('monthly');
  }

  private async createSnapshot(period: 'daily' | 'weekly' | 'monthly') {
    // Get top 100 users by P&L
    // Save to leaderboard_snapshots
    // Update user_stats rankings
    // Invalidate leaderboard cache
  }
}
```

### 7.3 Market Lifecycle Job

**CRITICAL:** The smart contract does NOT emit events when markets close (transition from `Open` → `TradingClosed`). This job handles state transitions that happen on-chain without events.

**Schedules:**

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `syncClosedMarkets` | Every minute | Detect market closing (no event emitted) |
| `notifyClosingMarkets` | Every minute | Warn position holders (1h, 24h before close) |
| `checkFinalizationReady` | Every 5 min | Log markets ready for finalize_uncontested |
| `syncPendingResolutions` | Every 10 min | Sync states for pending markets |

```
syncClosedMarkets():
  1. Find markets where chainState='open' AND tradingCloseTs < now
  2. For each market:
     a. Fetch on-chain state via RPC
     b. If chain state differs from DB:
        - Update chainState
        - Invalidate cache
        - Emit WebSocket state_change event

notifyClosingMarkets():
  1. Find markets closing in ~1 hour (tradingCloseTs in ±1min window)
  2. Find markets closing in ~24 hours
  3. For each: notify all position holders via notification service

syncPendingResolutions():
  1. Find markets in pending states (trading_closed, proposed_resolution, disputed)
  2. Fetch each from chain
  3. If state differs: update DB, emit WebSocket event

State Mapping:
  Open → open
  TradingClosed → trading_closed
  ProposedResolution → proposed_resolution
  Disputed → disputed
  Finalized → finalized
  Canceled → canceled
```

### 7.4 Stats Aggregation Job

```
updateMarketStats() [Every 5 min]:
  - Calculate 24h volume/trades for each active market
  - Update market_stats table

recalculateUserStats() [Hourly]:
  - Recalculate user_stats from trades
  - Update rankings
```

---

## 8. Admin Module

### 8.1 Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/markets` | List all markets (admin view) |
| POST | `/api/v1/admin/markets/:pubkey/resolve` | Resolve disputed market |
| POST | `/api/v1/admin/markets/:pubkey/cancel` | Cancel market |
| GET | `/api/v1/admin/disputes` | List pending disputes |
| PATCH | `/api/v1/admin/disputes/:id` | Update dispute status |
| GET | `/api/v1/admin/users` | List users |
| PATCH | `/api/v1/admin/users/:id/status` | Update user status |
| GET | `/api/v1/admin/stats` | Platform statistics |
| GET | `/api/v1/admin/audit-log` | Admin action audit log |
| POST | `/api/v1/admin/sync/market/:pubkey` | Sync market from chain |
| POST | `/api/v1/admin/sync/trades/:marketPubkey` | Backfill trades from Helius |
| GET | `/api/v1/admin/sync/status` | Sync health status |

### 8.1.1 Data Sync & Backfill Endpoints (MVP Critical)

If webhooks fail or events are missed, these endpoints allow manual recovery:

```typescript
// POST /api/v1/admin/sync/market/:pubkey
// Fetches Market account from RPC and updates database
interface SyncMarketRequest {
  pubkey: string;  // Market PDA address
}

interface SyncMarketResponse {
  success: boolean;
  market: {
    pubkey: string;
    chainState: string;
    qState: string[];
    resolvedOutcome: number | null;
  };
  changes: string[];  // ["chainState: open -> trading_closed", "qState updated"]
}

// POST /api/v1/admin/sync/trades/:marketPubkey
// Fetches TradeExecuted events from Helius transaction history
interface BackfillTradesRequest {
  marketPubkey: string;
  fromSlot?: number;    // Start slot (default: market creation slot)
  toSlot?: number;      // End slot (default: current slot)
}

interface BackfillTradesResponse {
  success: boolean;
  tradesFound: number;
  tradesInserted: number;
  tradesSkipped: number;  // Already existed (idempotency)
  errors: string[];
}

// GET /api/v1/admin/sync/status
// Returns health of Helius webhook sync
interface SyncStatusResponse {
  healthy: boolean;
  lastEventReceivedAt: string;
  eventLag: number;           // Seconds since last event
  pendingEvents: number;      // Queue depth
  failedEvents: number;       // In goldsky_failed_events
  tables: {
    markets: { count: number, lastSync: string };
    trades: { count: number, lastSync: string };
    positions: { count: number, lastSync: string };
  };
}
```

**Implementation:**

```
POST /api/v1/admin/sync/market/:pubkey
  1. Fetch market account from Solana RPC
  2. Find existing market in DB (404 if not found)
  3. Compare and track changes (chainState, qState, resolvedOutcome)
  4. Save updates, recalculate probabilities
  5. Log admin action for audit trail
  6. Return { success, market, changes[] }

POST /api/v1/admin/sync/trades/:marketPubkey
  1. Fetch transaction history from Helius Enhanced API (fromSlot → toSlot)
  2. For each transaction:
     a. Parse TradeExecuted events
     b. Check idempotency (skip if tx_signature exists)
     c. Process via TradeExecutedHandler
  3. Return { success, tradesFound, tradesInserted, tradesSkipped, errors[] }
```

### 8.2 Admin Authentication

```
AdminGuard.canActivate():
  1. Get user from request (set by WalletAuthGuard)
  2. Lookup admin_users where userId = user.id AND isActive = true
  3. If not found → 403 Forbidden
  4. Attach adminRole to request for permission checks
  5. Return true
```

### 8.3 Audit Logging

All admin actions MUST be logged to `admin_actions` table:

```
logAction(adminUserId, actionType, targets, reason, details?, stateBefore?, stateAfter?):
  Insert into admin_actions:
    - adminUserId, actionType, reason
    - targetUserId, targetMarketId, targetDisputeId (from targets)
    - details (JSON), stateBefore (JSON), stateAfter (JSON)
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Coverage targets:**
- Services: 80%+
- Utils (LMSR, pagination): 95%+
- Guards: 90%+

**Key tests:**
- LMSR cost calculation accuracy
- Webhook event parsing
- Cache service operations
- Authentication flow

### 9.2 Integration Tests

**Test scenarios:**
- Webhook event processing (all 11 events + idempotency)
- Complete authentication flow
- Market listing with all filter combinations
- Portfolio calculation with positions
- WebSocket subscription and events
- Market lifecycle job state sync
- Admin backfill endpoints

### 9.3 E2E Tests

**Test flows:**
1. User registers → trades → views portfolio → redeems
2. Market created → trades → resolved → payouts
3. Market disputed → admin resolves
4. Admin actions and audit logging

---

## 10. Deployment

### 10.1 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 10.2 docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/maybefun
      - REDIS_URL=redis://redis:6379
      - HELIUS_WEBHOOK_SECRET=${HELIUS_WEBHOOK_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - SOLANA_RPC_URL=${SOLANA_RPC_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=maybefun
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 10.3 docker-compose.dev.yml (Development)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/maybefun
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    command: npm run start:dev

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=maybefun
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@maybefun.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    ports:
      - "8080:80"
    depends_on:
      - db

  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  postgres_data_dev:
```

### 10.4 Health Check Endpoint

Required for container orchestration (Kubernetes, ECS, etc.):

```
GET /health → Liveness check
  - Ping database
  - Ping Redis

GET /health/ready → Readiness check
  - Ping database
  - Ping Redis
  - (Optional) Check Helius connectivity in production
```

### 10.5 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/maybefun

# Redis
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=your-secret-key
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Helius
HELIUS_WEBHOOK_SECRET=your-webhook-secret
HELIUS_API_KEY=your-api-key

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PROGRAM_ID=5JpYHw8ZbxiAUUnzjARsP2GYKCJpbucqenVmqoVyKig9
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# CORS
CORS_ORIGINS=https://maybe.fun,http://localhost:3001
```

---

## Appendix A: Smart Contract Event Signatures

All events emitted by the smart contract (11 total):

```
1.  EventWithMarketsCreated(event, event_id, creator, num_markets, created_ts)
2.  MarketCreated(market, market_id, parent_event, creator)
3.  TradeExecuted(market, trader, outcome, size, cost, is_buy, ts)
4.  ResolutionProposed(market, proposer, outcome, proposed_ts)
5.  DisputeOpened(market, disputer, bond_amount, created_ts)
6.  AdminResolved(market, final_outcome, dispute_wins, bond)
7.  UncontestedFinalized(market, resolved_outcome)
8.  WinningsRedeemed(market, user, outcome, shares, payout)
9.  CreatorFeesWithdrawn(market, creator, amount)
10. ProtocolUsdcWithdrawn(admin, amount)
11. ProtocolSolWithdrawn(admin, lamports)
```

**NOTE:** Market closing (`close_trading` and `emergency_close_trading` instructions) transitions the market state but does NOT emit a named event. The backend detects this state change via the Market Lifecycle Job (Section 7.3) which polls on-chain state for markets past their `trading_close_ts`.

---

## Appendix B: PDA Derivation

For fetching on-chain data or verifying events:

```typescript
// Global Config
["global-config"]

// Event
["event", event_id_bytes]

// Market
["market", event_id_bytes, market_id_bytes]

// Vault
["vault", event_id_bytes, market_id_bytes]

// Outcome Mint
["outcome-mint", event_id_bytes, market_id_bytes, [outcome_index]]

// Position
["position", market_pubkey_bytes, user_pubkey_bytes]

// Dispute
["dispute", market_pubkey_bytes]

// Protocol Fee Vault
["protocol-fee-vault"]
```

---

## Appendix C: Solana Service (RPC Integration)

The `SolanaService` is used for fetching on-chain account data when webhooks don't provide complete information.

**Setup:**
- Connection to SOLANA_RPC_URL with 'confirmed' commitment
- Read-only Anchor provider (no wallet needed for fetching)
- Program initialized with IDL and PROGRAM_ID

**Methods:**

```
fetchMarketAccount(pubkey) → {
  eventId, marketId, creator, b, state,
  tradingCloseTs, resolutionDeadlineTs, disputeDeadlineTs,
  q[], resolvedOutcome, disputed,
  creatorFeeEarned, protocolFeeEarned
}
  - Fetch via program.account.market.fetch(pubkey)
  - State is Anchor enum: extract first key of state object

fetchPositionAccount(marketPubkey, userWallet) → { shares[] } | null
  - Derive PDA: ["position", marketPubkey, userWallet]
  - Fetch via program.account.position.fetch(pda)
  - Return null if account doesn't exist

deriveMarketPdas(eventId, marketId) → { marketPda, vaultPda, yesMintPda, noMintPda }
  - Uses PublicKey.findProgramAddressSync with seeds from Appendix B
```

---

## Appendix D: LMSR Math Reference

**Formulas:**
```
Cost function:     C(q) = b × ln(Σ exp(q_i / b))
Cost delta:        cost = C(q_new) - C(q_old)
Probability:       prob_i = exp(q_i / b) / Σ exp(q_j / b)
```

**Implementation Notes:**
- Use Q64.64 fixed-point arithmetic on-chain for precision
- Use log-sum-exp trick for numerical stability (subtract max before exp)
- q values stored as i64, b as u64

**LmsrUtil Methods:**

```
calculateProbability(q[], b, outcomeIndex) → number (0-1)
  1. maxQ = max(q)
  2. expTerms[i] = exp((q[i] - maxQ) / b)  // log-sum-exp trick
  3. return expTerms[outcomeIndex] / sum(expTerms)

calculateCost(qOld[], b, outcomeIndex, shares, isBuy) → bigint (USDC base units)
  1. qNew = copy(qOld)
  2. qNew[outcomeIndex] += shares (buy) or -= shares (sell)
  3. return costFunction(qNew) - costFunction(qOld)

costFunction(q[], b) → bigint
  1. maxQ = max(q)
  2. sumExp = Σ exp((q[i] - maxQ) / b)
  3. return floor(b × (maxQ/b + ln(sumExp)))

calculatePriceImpact(qOld[], qNew[], b, outcomeIndex) → number
  return |probNew - probOld| / probOld
```

---

## Appendix E: Related Documentation

- **Database Schema:** `/db-schema.txt`
- **Smart Contract Source:** `/smart-contact/programs/maybe_fun/src/`
- **Frontend Integration Guide:** `/smart-contact/docs/INTEGRATION.md`
- **Smart Contract Events:** `/smart-contact/programs/maybe_fun/src/lib.rs`
