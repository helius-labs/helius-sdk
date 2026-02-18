/** Options for creating a Helius RPC client. */
export interface HeliusRpcOptions {
  /** Helius API key. Required for webhooks, enhanced transactions, and the Wallet API. */
  apiKey?: string;
  /** Solana network to connect to. Defaults to `"mainnet"`. */
  network?: "mainnet" | "devnet";
  /** Wallet address that receives rebates for RPC usage. Appended as a query parameter. */
  rebateAddress?: string;
  /** Custom RPC base URL. When provided, `network` is ignored. */
  baseUrl?: string;
  /** Custom User-Agent string appended to outgoing HTTP requests. */
  userAgent?: string;
}
