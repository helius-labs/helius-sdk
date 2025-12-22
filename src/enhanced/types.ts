export type Commitment = "finalized" | "confirmed";

export type TransactionType = string;
export type TransactionSource = string;
export type SortOrder = "asc" | "desc";

export interface EnhancedNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface EnhancedTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number | string;
  decimals?: number;
}

export interface EnhancedInstruction {
  programId: string;
  programName?: string;
  innerInstructions?: EnhancedInstruction[];
  parsed?: Record<string, unknown>;
}

export interface EnhancedEvents {
  // Shape differs per program (keep open); will update later
  [k: string]: unknown;
}

export interface EnhancedTransaction {
  description?: string;
  type?: TransactionType;
  source?: TransactionSource;
  fee?: number;
  feePayer?: string;
  signature: string;
  slot?: number;
  timestamp?: number;

  nativeTransfers?: EnhancedNativeTransfer[];
  tokenTransfers?: EnhancedTokenTransfer[];
  accountData?: unknown[];
  transactionError?: unknown;
  instructions?: EnhancedInstruction[];
  events?: EnhancedEvents;
}

/** POST /v0/transactions */
export interface GetEnhancedTransactionsRequest {
  transactions: string[];
  commitment?: Commitment;
}
export type GetEnhancedTransactionsResponse = EnhancedTransaction[];

/** GET /v0/addresses/:address/transactions */
export interface GetEnhancedTransactionsByAddressRequest {
  address: string;
  beforeSignature?: string;
  afterSignature?: string;
  commitment?: Commitment;
  source?: TransactionSource;
  type?: TransactionType;
  limit?: number;
  gtSlot?: number;
  gteSlot?: number;
  ltSlot?: number;
  lteSlot?: number;
  gtTime?: number;
  gteTime?: number;
  ltTime?: number;
  lteTime?: number;
  sortOrder?: SortOrder;
}
export type GetEnhancedTransactionsByAddressResponse = EnhancedTransaction[];
