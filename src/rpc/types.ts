import type { TransportHook } from "./transport";

/** Options for creating a Helius RPC client. */
export interface HeliusRpcOptions {
  /** Helius API key. Required for webhooks, enhanced transactions, the Wallet API, and the Admin API. */
  apiKey?: string;
  /** Solana network to connect to. Defaults to `"mainnet"`. */
  network?: "mainnet" | "devnet";
  /** Wallet address that receives rebates for RPC usage. Appended as a query parameter. */
  rebateAddress?: string;
  /** Custom RPC base URL. When provided, `network` is ignored. */
  baseUrl?: string;
  /** Custom User-Agent string appended to outgoing HTTP requests. */
  userAgent?: string;
  /**
   * Augment or replace the default RPC transport. Receives the SDK's fully
   * configured transport (Helius URL with API key, SDK headers, request-id
   * stamping) and returns the transport used for all JSON-RPC calls —
   * standard Solana RPC and DAS/Helius methods alike. Enables retries,
   * failover, logging, etc. Does not affect WebSocket subscriptions or
   * REST sub-clients (webhooks, enhanced, wallet, admin, auth).
   */
  transport?: TransportHook;
}
