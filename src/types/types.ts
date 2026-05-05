import type { Commitment, RpcResponse } from "@solana/kit";

import { Asset } from "./das";
import { PriorityLevel, UiTransactionEncoding } from "./enums";

/** Request parameters for `getAsset` — fetch a single asset by mint address. */
export type GetAssetRequest = {
  /** The unique identifier of the asset to retrieve. This is typically the mint address of the NFT or token. */
  id: string;
  options?: {
    /** Displays fungible tokens held by the owner. Defaults to `false`. */
    showFungible?: boolean;
    /** Displays grouping information for unverified collections instead of skipping them. Defaults to `false`. */
    showUnverifiedCollections?: boolean;
    /** Displays metadata for the collection. Defaults to `false`. */
    showCollectionMetadata?: boolean;
    /** Displays inscription details of assets inscribed on-chain. Defaults to `false`. */
    showInscription?: boolean;
  };
};
/** Response from `getAsset`. An `Asset` object. */
export type GetAssetResponse = Asset;

/** Request parameters for `getAssetBatch` — fetch multiple assets by mint addresses. */
export type GetAssetBatchRequest = {
  /** Array of asset mint addresses. */
  ids: string[];
  options?: {
    /** Displays fungible tokens held by the owner. Defaults to `false`. */
    showFungible?: boolean;
    /** Displays grouping information for unverified collections instead of skipping them. Defaults to `false`. */
    showUnverifiedCollections?: boolean;
    /** Displays metadata for the collection. Defaults to `false`. */
    showCollectionMetadata?: boolean;
    /** Displays inscription details of assets inscribed on-chain. Defaults to `false`. */
    showInscription?: boolean;
  };
};
/** Response from `getAssetBatch`. An array of `Asset` objects. */
export type GetAssetBatchResponse = Asset[];

/** Request parameters for `getAssetProof` — get the Merkle proof for a compressed asset. */
export type GetAssetProofRequest = {
  /** The unique identifier (mint address) of the compressed Solana NFT to retrieve the Merkle proof for. */
  id: string;
};

/** Merkle proof data for a compressed NFT. */
export interface GetAssetProofResponse {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** The root hash of the Solana state compression Merkle tree that contains this compressed NFT. */
  root: string;
  /** Array of Merkle proof hashes needed to cryptographically verify this compressed NFT exists in the tree. */
  proof: Array<string>;
  /** The position index of this compressed NFT in the Merkle tree structure. */
  node_index: number;
  /** The leaf hash representing this compressed NFT's data in the Merkle tree. */
  leaf: string;
  /** The unique identifier of the Solana Merkle tree where this compressed NFT is stored. */
  tree_id: string;
  /** Whether the asset has been burnt. */
  burnt?: boolean;
}

/** Request parameters for `getAssetProofBatch`. */
export type GetAssetProofBatchRequest = {
  /** Array of unique identifiers (mint addresses) of the compressed Solana NFTs to retrieve Merkle proofs for. */
  ids: string[];
};

/** Response from `getAssetProofBatch`. A map of mint address → proof data for each requested asset. */
export type GetAssetProofBatchResponse = Record<string, GetAssetProofResponse>;

// ── Priority Fee API ────────────────────────────────────────────────

/** Request parameters for `getPriorityFeeEstimate`. */
export interface GetPriorityFeeEstimateRequest {
  /**
   * Base58 or Base64 encoded serialized transaction to estimate fees for.
   * The API analyzes the specific instructions and accounts in this transaction
   * to provide accurate fee estimates based on current network conditions.
   */
  transaction?: string;
  /** Array of Solana account public keys to estimate priority fees for (alternative to providing a `transaction`). */
  accountKeys?: string[];
  /** Advanced options for customizing the fee estimation. */
  options?: GetPriorityFeeEstimateOptions;
}

/** Options for customizing Solana priority fee estimation. */
export interface GetPriorityFeeEstimateOptions {
  /** Specific priority level to estimate fees for based on current network congestion. */
  priorityLevel?: PriorityLevel;
  /** When `true`, returns fee estimates for all priority levels from minimum to maximum. */
  includeAllPriorityFeeLevels?: boolean;
  /** Encoding format of the provided transaction (`"Base58"` or `"Base64"`). */
  transactionEncoding?: UiTransactionEncoding;
  /** Number of recent slots to analyze for fee estimation (1–150). */
  lookbackSlots?: number;
  /** When `true`, returns the recommended optimal fee based on current network conditions. */
  recommended?: boolean;
  /** When `true`, includes vote transactions in the fee calculation. */
  includeVote?: boolean;
  /** When `true`, slots with no transactions are counted as zero-fee slots in the calculation. */
  evaluateEmptySlotAsZero?: boolean;
}

/** Priority fee estimates at each level, in microlamports per compute unit. */
export interface MicroLamportPriorityFeeLevels {
  /** Minimum viable fee — suitable for non-urgent transactions during low network congestion. */
  min: number;
  /** Low priority fee — economical option for transactions that are not time-sensitive. */
  low: number;
  /** Medium priority fee — balanced option for most standard transactions. */
  medium: number;
  /** High priority fee — prioritized processing for time-sensitive operations like DeFi trades or NFT mints. */
  high: number;
  /** Very high priority fee — premium option for critical transactions requiring near-immediate confirmation. */
  veryHigh: number;
  /** Maximum observed fee in the analysis window — upper bound during extreme network congestion. */
  unsafeMax: number;
}

/** Response from `getPriorityFeeEstimate`. */
export interface GetPriorityFeeEstimateResponse {
  /** Estimated optimal priority fee in microlamports per compute unit for the requested transaction. */
  priorityFeeEstimate?: number;
  /** Detailed fee estimates for all priority levels in microlamports per compute unit (present when `includeAllPriorityFeeLevels` is set). */
  priorityFeeLevels?: MicroLamportPriorityFeeLevels;
}

/** Account data encoding for V2 RPC methods. */
export type Encoding = "jsonParsed" | "base58" | "base64" | "base64+zstd";

// ── getProgramAccountsV2 ────────────────────────────────────────────

/** Configuration for `getProgramAccountsV2` — paginated program account queries. */
export type GetProgramAccountsV2Config = {
  commitment?: Commitment;
  minContextSlot?: number;
  /** Wrap the result in an RPC context object with slot info. */
  withContext?: boolean;
  encoding?: Encoding;
  /** Return only a slice of each account's data. */
  dataSlice?: { length: number; offset: number };
  /** Max results per page (up to 10,000). */
  limit?: number;
  /** Base-58 pagination cursor. `null` when no more pages. */
  paginationKey?: string | null;
  /** Only return accounts modified after this slot. */
  changedSinceSlot?: number;
  /** Account filters (dataSize or memcmp). */
  filters?: ReadonlyArray<
    { dataSize: number } | { memcmp: { offset: number; bytes: string } }
  >;
};

/** Request tuple for `getProgramAccountsV2`: `[programId, config?]`. */
export type GetProgramAccountsV2Request = [string, GetProgramAccountsV2Config?];

/** Account info within a `getProgramAccountsV2` response. */
export type GpaV2AccountInfo = {
  lamports: number;
  owner: string;
  data: any;
  executable: boolean;
  rentEpoch: number;
  space?: number;
};

/** A single account entry in a `getProgramAccountsV2` response. */
export type GpaV2Account = {
  pubkey: string;
  account: GpaV2AccountInfo;
};

/** Result payload from `getProgramAccountsV2`. */
export type GetProgramAccountsV2Result = {
  accounts: ReadonlyArray<GpaV2Account>;
  /** Cursor for the next page, or `null` when done. */
  paginationKey: string | null;
  /** Total number of matching accounts (may be absent). */
  totalResults?: number | null;
};

/** Response from `getProgramAccountsV2` (raw or wrapped in RPC context). */
export type GetProgramAccountsV2Response =
  | GetProgramAccountsV2Result
  | RpcResponse<GetProgramAccountsV2Result>;

// ── getTokenAccountsByOwnerV2 ───────────────────────────────────────

/** Data slice parameters for V2 token account queries. */
export type GtaV2DataSlice = { length: number; offset: number };

/** Filter for `getTokenAccountsByOwnerV2` — narrow by mint or program. */
export type GetTokenAccountsByOwnerV2Filter = {
  /** Filter to a specific token mint. */
  mint?: string;
  /** Filter to a specific token program (e.g. Token-2022). */
  programId?: string;
};

/** Configuration for `getTokenAccountsByOwnerV2`. */
export type GetTokenAccountsByOwnerV2Config = {
  commitment?: Commitment;
  minContextSlot?: number;
  dataSlice?: GtaV2DataSlice;
  encoding?: Encoding;
  /** Max results per page (up to 10,000). */
  limit?: number;
  /** Base-58 pagination cursor. `null` when no more pages. */
  paginationKey?: string | null;
  /** Only return accounts modified after this slot. */
  changedSinceSlot?: number;
};

/** Request tuple for `getTokenAccountsByOwnerV2`: `[owner, filter?, config?]`. */
export type GetTokenAccountsByOwnerV2Request = [
  string,
  GetTokenAccountsByOwnerV2Filter?,
  GetTokenAccountsByOwnerV2Config?,
];

/** Account info within a `getTokenAccountsByOwnerV2` response. */
export type GtaV2AccountInfo = {
  lamports: number;
  owner: string;
  data: any;
  executable: boolean;
  rentEpoch: number;
  space?: number;
};

/** A single account entry in a `getTokenAccountsByOwnerV2` response. */
export type GtaV2Account = {
  pubkey: string;
  account: GtaV2AccountInfo;
};

/** Result payload from `getTokenAccountsByOwnerV2`. */
export type GetTokenAccountsByOwnerV2Result = {
  accounts: ReadonlyArray<GtaV2Account>;
  paginationKey: string | null;
  totalResults?: number | null;
};

/** Response from `getTokenAccountsByOwnerV2` (raw or wrapped in RPC context). */
export type GetTokenAccountsByOwnerV2Response =
  | GetTokenAccountsByOwnerV2Result
  | RpcResponse<GetTokenAccountsByOwnerV2Result>;

// ── getTransactionsForAddress ───────────────────────────────────────

/** Base configuration for `getTransactionsForAddress` with rich filtering. */
export type GetTransactionsForAddressBaseConfig = {
  commitment?: Commitment;
  minContextSlot?: number;
  encoding?: "json" | "jsonParsed" | "base64" | "base58";
  maxSupportedTransactionVersion?: number;
  /** Max results per page. */
  limit?: number;
  /** Pagination token from a previous response. `null` when no more pages. */
  paginationToken?: string | null;
  /** Sort order by slot/blockTime. */
  sortOrder?: "asc" | "desc";
  /** Rich filters for status, token accounts, slot, blockTime, and signature ranges. */
  filters?: {
    /** Filter by transaction status */
    status?: "succeeded" | "failed" | "any";
    /**
     * Filter transactions for related token accounts:
     * - `none`: Only return transactions that reference the provided address (default)
     * - `balanceChanged`: Include transactions that modify token account balances owned by the address (recommended)
     * - `all`: Include all transactions involving any token account owned by the address
     */
    tokenAccounts?: "none" | "balanceChanged" | "all";
    /** Filter by slot number */
    slot?: {
      /** Equal to */
      eq?: number;
      /** Greater than or equal to */
      gte?: number;
      /** Greater than */
      gt?: number;
      /** Less than or equal to */
      lte?: number;
      /** Less than */
      lt?: number;
    };
    /** Filter by block time (Unix timestamp) */
    blockTime?: {
      /** Equal to */
      eq?: number;
      /** Greater than or equal to */
      gte?: number;
      /** Greater than */
      gt?: number;
      /** Less than or equal to */
      lte?: number;
      /** Less than */
      lt?: number;
    };
    /** Filter by signature (lexicographic comparison) */
    signature?: {
      /** Greater than or equal to */
      gte?: string;
      /** Greater than */
      gt?: string;
      /** Less than or equal to */
      lte?: string;
      /** Less than */
      lt?: string;
    };
  };
};

/** Config for `transactionDetails: "signatures"` (default). */
export type GetTransactionsForAddressConfigSignatures =
  GetTransactionsForAddressBaseConfig & {
    transactionDetails?: "signatures";
  };

/** Config for `transactionDetails: "full"`. */
export type GetTransactionsForAddressConfigFull =
  GetTransactionsForAddressBaseConfig & {
    transactionDetails: "full";
  };

/** Union config type for `getTransactionsForAddress`. */
export type GetTransactionsForAddressConfig =
  | GetTransactionsForAddressConfigSignatures
  | GetTransactionsForAddressConfigFull;

/** A transaction signature entry (when `transactionDetails` is `"signatures"`). */
export type TransactionForAddressSignature = {
  signature: string;
  slot: number;
  transactionIndex: number;
  err: null | object;
  memo: null | string;
  blockTime: number;
  confirmationStatus: "finalized" | "confirmed" | "processed";
};

/** A full transaction entry (when `transactionDetails` is `"full"`). */
export type TransactionForAddressFull = {
  slot: number;
  transactionIndex: number;
  transaction: object;
  meta: object | null;
  blockTime: number | null;
};

/** Paginated result with signature-level transaction data. */
export type GetTransactionsForAddressResultSignatures = {
  data: ReadonlyArray<TransactionForAddressSignature>;
  paginationToken: string | null;
};

/** Paginated result with full transaction data. */
export type GetTransactionsForAddressResultFull = {
  data: ReadonlyArray<TransactionForAddressFull>;
  paginationToken: string | null;
};

// ── getTransfersByAddress ───────────────────────────────────────────

/** Numeric comparison filter used by transfer amount, blockTime, and slot filters. */
export type TransferComparisonFilter = {
  /** Greater than */
  gt?: number;
  /** Greater than or equal to */
  gte?: number;
  /** Less than */
  lt?: number;
  /** Less than or equal to */
  lte?: number;
};

/** Configuration for `getTransfersByAddress` transfer queries. */
export type GetTransfersByAddressConfig = {
  /** Filter by counterparty address. Returns only transfers to or from this address. */
  with?: string;
  /** Filter by transfer direction relative to the queried address. */
  direction?: "in" | "out" | "any";
  /** Filter by token mint address. Use native SOL or WSOL mint addresses for SOL filtering. */
  mint?: string;
  /** SOL/WSOL display mode. */
  solMode?: "merged" | "separate";
  /** Additional filters for amount, block time, and slot. */
  filters?: {
    /** Filter by raw transfer amount, not UI amount. */
    amount?: TransferComparisonFilter;
    /** Filter by block timestamp in Unix seconds. */
    blockTime?: TransferComparisonFilter;
    /** Filter by slot number. */
    slot?: TransferComparisonFilter;
  };
  /** Max transfers per page. */
  limit?: number;
  /** Pagination token from a previous response. `null` when no more pages. */
  paginationToken?: string | null;
  /** Data commitment level. */
  commitment?: "finalized" | "confirmed";
  /** Result ordering. */
  sortOrder?: "asc" | "desc";
};

/** Request tuple for `getTransfersByAddress`: `[address, config?]`. */
export type GetTransfersByAddressRequest = [
  string,
  GetTransfersByAddressConfig?,
];

/** Parsed, human-readable token or native SOL transfer record. */
export type TokenTransfer = {
  /** Base58-encoded transaction signature. */
  signature: string;
  /** Slot number containing the transaction. */
  slot: number;
  /** Unix timestamp in seconds for the block. */
  blockTime: number;
  /** Parsed transfer type. */
  type:
    | "transfer"
    | "mint"
    | "burn"
    | "wrap"
    | "unwrap"
    | "changeOwner"
    | "withdrawWithheldFee";
  /** Wallet address that sent the tokens, or `null` when no sender exists. */
  fromUserAccount: string | null;
  /** Wallet address that received the tokens, or `null` when no recipient exists. */
  toUserAccount: string | null;
  /** Source token account. Omitted when not applicable, such as native SOL transfers. */
  fromTokenAccount?: string;
  /** Destination token account. Omitted when not applicable, such as native SOL transfers. */
  toTokenAccount?: string;
  /** Token mint address. */
  mint: string;
  /** Raw transfer amount as a string to preserve precision. */
  amount: string;
  /** Transfer fee withheld by the Token-2022 transfer-fee extension. */
  feeAmount?: string;
  /** Token account associated with the withheld fee. */
  feeAccount?: string;
  /** Token decimals. Native SOL uses 9. */
  decimals: number;
  /** Human-readable amount. */
  uiAmount: string;
  /** Human-readable fee amount. Present only when `feeAmount` is present. */
  feeUiAmount?: string;
  /** Confirmation status. */
  confirmationStatus: "finalized" | "confirmed";
  /** Index of the transaction within the block. */
  transactionIdx: number;
  /** Index of the instruction within the transaction. */
  instructionIdx: number;
  /** Index within inner instructions. `0` when the transfer is top-level. */
  innerInstructionIdx: number;
};

/** Paginated result with parsed transfer data. */
export type GetTransfersByAddressResult = {
  data: ReadonlyArray<TokenTransfer>;
  paginationToken: string | null;
};
