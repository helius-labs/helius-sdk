/** Request parameters for creating a new webhook. */
export interface CreateWebhookRequest {
  /** The URL that will receive webhook POST requests. */
  webhookURL: string;
  /** Transaction types to subscribe to (e.g. `["NFT_SALE"]`). */
  transactionTypes: string[];
  /** Array of base58-encoded Solana account addresses to monitor for events. */
  accountAddresses: string[];
  /** Delivery format for webhook payloads: `enhanced`, `raw`, `discord`, `enhancedDevnet`, `rawDevnet`, or `discordDevnet`. */
  webhookType?: string;
  /** Authorization header value sent with each webhook delivery request. */
  authHeader?: string;
  /** Payload encoding (e.g. `"json"`). */
  encoding?: string;
  /** Filter by transaction status (e.g. `"all"`, `"success"`, `"failed"`). */
  txnStatus?: string;
}

/** A Helius webhook subscription. */
export interface Webhook {
  /** UUIDv4 that uniquely identifies the webhook. */
  webhookID: string;
  /** Wallet address that owns this webhook. */
  wallet: string;
  /** The URL receiving webhook POST requests. */
  webhookURL: string;
  /** Transaction types this webhook is subscribed to. */
  transactionTypes: string[];
  /** Array of base58-encoded Solana account addresses being monitored for events. */
  accountAddresses: string[];
  /** Delivery format for webhook payloads: `enhanced`, `raw`, `discord`, `enhancedDevnet`, `rawDevnet`, or `discordDevnet`. */
  webhookType: string;
  /** Authorization header value sent with each webhook delivery request. */
  authHeader: string;
}

/** Request parameters for updating an existing webhook. All fields are optional. */
export type UpdateWebhookRequest = Partial<CreateWebhookRequest>;
