/**
 * Filter for `transactionSubscribe`. Controls which transactions are streamed.
 */
export interface TransactionSubscribeFilter {
  /** Include vote transactions. */
  vote?: boolean;
  /** Include failed transactions. */
  failed?: boolean;
  /** Filter to a specific transaction signature. */
  signature?: string;
  /** Include transactions involving any of these accounts (OR logic). */
  accountInclude?: string[];
  /** Exclude transactions involving any of these accounts. */
  accountExclude?: string[];
  /** Require transactions to involve all of these accounts (AND logic). */
  accountRequired?: string[];
}

/**
 * Configuration for `transactionSubscribe`.
 */
export interface TransactionSubscribeConfig {
  /** Commitment level for the subscription. */
  commitment?: "processed" | "confirmed" | "finalized";
  /** Encoding for transaction data. */
  encoding?: "base58" | "base64" | "base64+zstd" | "jsonParsed";
  /** Level of transaction detail returned. */
  transactionDetails?: "full" | "signatures" | "accounts" | "none";
  /** Whether to include rewards in the response. */
  showRewards?: boolean;
  /** Maximum supported transaction version. */
  maxSupportedTransactionVersion?: number;
}

/**
 * Notification payload from `transactionSubscribe`.
 */
export interface TransactionNotificationResult {
  /** The transaction data (format depends on `encoding` and `transactionDetails`). */
  transaction: unknown;
  /** The transaction signature. */
  signature: string;
  /** The slot in which the transaction was processed. */
  slot: number;
  /** Index of the transaction within the block. */
  transactionIndex?: number;
}

/**
 * Configuration for Enhanced `accountSubscribe`.
 */
export interface EnhancedAccountSubscribeConfig {
  /** Encoding for account data. */
  encoding?: "base58" | "base64" | "base64+zstd" | "jsonParsed";
  /** Commitment level for the subscription. */
  commitment?: "processed" | "confirmed" | "finalized";
}

/**
 * Notification payload from Enhanced `accountSubscribe`.
 */
export interface EnhancedAccountNotificationResult {
  context: { slot: number };
  value: {
    lamports: number;
    data: unknown;
    owner: string;
    executable: boolean;
    rentEpoch: number;
    space: number;
  };
}

/**
 * An active Enhanced WebSocket subscription. Implements `AsyncIterable` for
 * consuming notifications and provides an `unsubscribe()` method to clean up.
 */
export interface EnhancedSubscription<T> extends AsyncIterable<T> {
  /** The server-assigned subscription ID. */
  subscriptionId: number;
  /** Unsubscribe and stop receiving notifications. */
  unsubscribe(): Promise<boolean>;
}
