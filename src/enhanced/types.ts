/** Commitment level for enhanced transaction queries. */
export type Commitment = "finalized" | "confirmed";

/** Human-readable transaction type label (e.g. `"SWAP"`, `"NFT_SALE"`). */
export type TransactionType = string;
/** Human-readable transaction source label (e.g. `"JUPITER"`, `"MAGIC_EDEN"`). */
export type TransactionSource = string;
/** Sort order for transaction queries. */
export type SortOrder = "asc" | "desc";

/** A native SOL transfer within an enhanced transaction. */
export interface EnhancedNativeTransfer {
  /** Sender wallet address. */
  fromUserAccount: string;
  /** Recipient wallet address. */
  toUserAccount: string;
  /** Amount transferred in lamports. */
  amount: number;
}

/** An SPL token transfer within an enhanced transaction. */
export interface EnhancedTokenTransfer {
  /** Sender wallet address. */
  fromUserAccount: string;
  /** Recipient wallet address. */
  toUserAccount: string;
  /** Token mint address. */
  mint: string;
  /** Amount transferred (UI amount or raw). */
  tokenAmount: number | string;
  /** Token decimal places. */
  decimals?: number;
}

/** A parsed instruction within an enhanced transaction. */
export interface EnhancedInstruction {
  /** Program ID that executed this instruction. */
  programId: string;
  /** Human-readable program name (e.g. `"SYSTEM_PROGRAM"`). */
  programName?: string;
  /** CPI inner instructions. */
  innerInstructions?: EnhancedInstruction[];
  /** Parsed instruction data (program-specific). */
  parsed?: Record<string, unknown>;
}

/** Program-specific events emitted by a transaction. */
export interface EnhancedEvents {
  // Shape differs per program (keep open); will update later
  [k: string]: unknown;
}

/**
 * A human-readable, parsed representation of a Solana transaction
 * returned by the Helius Enhanced Transactions API.
 */
export interface EnhancedTransaction {
  /** Human-readable description of the transaction. */
  description?: string;
  /** Transaction type label (e.g. `"SWAP"`, `"NFT_SALE"`, `"TRANSFER"`). */
  type?: TransactionType;
  /** Source protocol label (e.g. `"JUPITER"`, `"MAGIC_EDEN"`). */
  source?: TransactionSource;
  /** Transaction fee in lamports. */
  fee?: number;
  /** Fee payer address. */
  feePayer?: string;
  /** Transaction signature. */
  signature: string;
  /** Slot in which the transaction was confirmed. */
  slot?: number;
  /** Unix timestamp of the block. */
  timestamp?: number;

  /** Native SOL transfers in the transaction. */
  nativeTransfers?: EnhancedNativeTransfer[];
  /** SPL token transfers in the transaction. */
  tokenTransfers?: EnhancedTokenTransfer[];
  /** Raw account data changes. */
  accountData?: unknown[];
  /** Transaction error, if any. */
  transactionError?: unknown;
  /** Parsed instructions. */
  instructions?: EnhancedInstruction[];
  /** Program-specific events. */
  events?: EnhancedEvents;
}

/** Request parameters for `enhanced.getTransactions` (POST /v0/transactions). */
export interface GetEnhancedTransactionsRequest {
  /** Array of transaction signatures to parse. */
  transactions: string[];
  commitment?: Commitment;
}
/** Response from `enhanced.getTransactions`. */
export type GetEnhancedTransactionsResponse = EnhancedTransaction[];

/** Request parameters for `enhanced.getTransactionsByAddress` (GET /v0/addresses/:address/transactions). */
export interface GetEnhancedTransactionsByAddressRequest {
  /** Wallet or program address to query transactions for. */
  address: string;
  /** Return transactions before this signature. */
  beforeSignature?: string;
  /** Return transactions after this signature. */
  afterSignature?: string;
  commitment?: Commitment;
  /** Filter by transaction source. */
  source?: TransactionSource;
  /** Filter by transaction type. */
  type?: TransactionType;
  /** Maximum number of transactions to return. */
  limit?: number;
  /** Slot greater than. */
  gtSlot?: number;
  /** Slot greater than or equal to. */
  gteSlot?: number;
  /** Slot less than. */
  ltSlot?: number;
  /** Slot less than or equal to. */
  lteSlot?: number;
  /** Block time greater than (Unix timestamp). */
  gtTime?: number;
  /** Block time greater than or equal to (Unix timestamp). */
  gteTime?: number;
  /** Block time less than (Unix timestamp). */
  ltTime?: number;
  /** Block time less than or equal to (Unix timestamp). */
  lteTime?: number;
  /** Sort order by slot/time. */
  sortOrder?: SortOrder;
}
/** Response from `enhanced.getTransactionsByAddress`. */
export type GetEnhancedTransactionsByAddressResponse = EnhancedTransaction[];
