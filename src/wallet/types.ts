/**
 * Wallet API Types
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * For complete API documentation, see:
 * https://www.helius.dev/docs/api-reference/wallet-api
 *
 * For agents, see:
 * https://www.helius.dev/docs/api-reference/wallet-api/llms.txt
 */

/**
 * Identity information for a known wallet address (e.g., exchanges, protocols)
 */
export interface Identity {
  /** Solana wallet address */
  address: string;
  /** Type of entity (e.g., "exchange") */
  type: string;
  /** Display name (e.g., "Binance 1") */
  name: string;
  /** Category classification (e.g., "Centralized Exchange") */
  category: string;
  /** Additional classification tags */
  tags: string[];
}

/**
 * Request parameters for getting wallet identity
 */
export interface GetIdentityRequest {
  /** Solana wallet address (base58 encoded) */
  wallet: string;
}

/**
 * Response from getIdentity endpoint
 */
export type GetIdentityResponse = Identity;

/**
 * Request parameters for batch identity lookup
 */
export interface GetBatchIdentityRequest {
  /** Array of Solana wallet addresses to lookup (max 100) */
  addresses: string[];
}

/**
 * Response from getBatchIdentity endpoint
 */
export type GetBatchIdentityResponse = Identity[];

/**
 * Token program type
 */
export type TokenProgram = "spl-token" | "token-2022";

/**
 * Token balance information
 */
export interface TokenBalance {
  /** Token mint address */
  mint: string;
  /** Token symbol (if known) */
  symbol: string | null;
  /** Token name (if known) */
  name: string | null;
  /** Token balance (human-readable, adjusted for decimals) */
  balance: number;
  /** Number of decimal places */
  decimals: number;
  /** Price per token in USD (if available) */
  pricePerToken: number | null;
  /** Total USD value of holdings (if price available) */
  usdValue: number | null;
  /** URL to token logo image (if available) */
  logoUri: string | null;
  /** Token program type (`spl-token` for legacy SPL tokens, `token-2022` for the new Token Extensions standard). */
  tokenProgram: TokenProgram;
}

/**
 * NFT information
 */
export interface Nft {
  /** NFT mint address */
  mint: string;
  /** NFT name (if available) */
  name: string | null;
  /** NFT image URI (if available) */
  imageUri: string | null;
  /** Collection name (if part of a collection) */
  collectionName: string | null;
  /** Collection address (if part of a collection) */
  collectionAddress: string | null;
  /** Whether this is a compressed NFT */
  compressed: boolean;
}

/**
 * Request parameters for getting wallet balances
 */
export interface GetBalancesRequest {
  /** Solana wallet address (base58 encoded) */
  wallet: string;
  /** Page number for pagination (1-indexed, default: 1) */
  page?: number;
  /** Maximum number of tokens per page (max: 100, default: 100) */
  limit?: number;
  /** Include tokens with zero balance (default: false) */
  showZeroBalance?: boolean;
  /** Include native SOL in results (default: true) */
  showNative?: boolean;
  /** Include NFTs in results (max 100, first page only, default: false) */
  showNfts?: boolean;
}

/**
 * Response from getBalances endpoint
 */
export interface GetBalancesResponse {
  /**
   * Array of token balances for the current page.
   * When showNative=true, SOL appears with mint address So11111111111111111111111111111111111111112.
   * Results are sorted by USD value (descending).
   */
  balances: TokenBalance[];
  /**
   * Array of NFT holdings (only included if showNfts=true, max 100, first page only)
   */
  nfts?: Nft[];
  /**
   * Total USD value of balances on this page (not total portfolio value)
   */
  totalUsdValue: number;
  /**
   * Pagination metadata.
   * Users must manually request additional pages using the page parameter.
   */
  pagination: {
    /** Current page number */
    page: number;
    /** Number of items per page */
    limit: number;
    /** True if more results are available. Increment the page parameter to fetch the next page. */
    hasMore: boolean;
  };
}

/**
 * Balance change within a transaction
 */
export interface BalanceChange {
  /** Token mint address (or "SOL" for native) */
  mint: string;
  /** Change amount (positive = increase, negative = decrease) */
  amount: number;
  /** Token decimals */
  decimals: number;
}

/**
 * Transaction with balance changes
 */
export interface HistoryTransaction {
  /** Transaction signature */
  signature: string;
  /** Unix timestamp in seconds (null if not yet confirmed) */
  timestamp: number | null;
  /** Slot number */
  slot: number;
  /** Transaction fee in SOL */
  fee: number;
  /** Address that paid the transaction fee */
  feePayer: string;
  /** Error message if transaction failed (null if successful) */
  error: string | null;
  /** All balance changes in this transaction */
  balanceChanges: BalanceChange[];
}

/**
 * Request parameters for getting transaction history
 */
export interface GetHistoryRequest {
  /** Solana wallet address (base58 encoded) */
  wallet: string;
  /** Maximum number of transactions per request (max: 100, default: 100) */
  limit?: number;
  /** Fetch transactions before this signature (use pagination.nextCursor from previous response) */
  before?: string;
  /** Fetch transactions after this signature (for ascending order pagination) */
  after?: string;
  /**
   * Filter by transaction type.
   * Available types (truncated): SWAP, TRANSFER, NFT_SALE, NFT_BID, NFT_LISTING, NFT_MINT,
   * NFT_CANCEL_LISTING, TOKEN_MINT, BURN, COMPRESSED_NFT_MINT, COMPRESSED_NFT_TRANSFER,
   * COMPRESSED_NFT_BURN, CREATE_STORE, WHITELIST_CREATOR, ADD_TO_WHITELIST,
   * REMOVE_FROM_WHITELIST, AUCTION_MANAGER_CLAIM_BID, EMPTY_PAYMENT_ACCOUNT,
   * UPDATE_PRIMARY_SALE_METADATA, ADD_TOKEN_TO_VAULT, ACTIVATE_VAULT, INIT_VAULT,
   * INIT_BANK, INIT_STAKE, MERGE_STAKE, SPLIT_STAKE, CREATE_AUCTION_MANAGER,
   * START_AUCTION, CREATE_AUCTION_MANAGER_V2, UPDATE_EXTERNAL_PRICE_ACCOUNT,
   * EXECUTE_TRANSACTION
   */
  type?: string;
  /**
   * Filter transactions involving token accounts owned by the wallet.
   * - "balanceChanged" (recommended): Includes transactions that changed token balances, filters spam
   * - "none": Only transactions directly referencing the wallet
   * - "all": All transactions including token accounts (may include spam)
   * Default: "balanceChanged"
   */
  tokenAccounts?: "none" | "balanceChanged" | "all";
}

/**
 * Response from getHistory endpoint
 */
export interface GetHistoryResponse {
  /** Array of transactions in reverse chronological order (newest first) */
  data: HistoryTransaction[];
  /**
   * Pagination metadata.
   * Use the before parameter with nextCursor to fetch the next page.
   */
  pagination: {
    /** True if more results are available */
    hasMore: boolean;
    /** Cursor to fetch the next page (use with before parameter) */
    nextCursor?: string | null;
  };
}

/**
 * Transfer direction relative to the wallet
 */
export type TransferDirection = "in" | "out";

/**
 * Token transfer activity
 */
export interface Transfer {
  /** Transaction signature */
  signature: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transfer direction relative to the wallet */
  direction: TransferDirection;
  /** The other party in the transfer (sender if "in", recipient if "out") */
  counterparty: string;
  /** Token mint address (`So11111111111111111111111111111111111111112` for SOL). */
  mint: string;
  /** Token symbol if known */
  symbol: string | null;
  /** Transfer amount (human-readable, divided by decimals) */
  amount: number;
  /** Raw transfer amount in smallest unit (lamports for SOL, raw token amount for SPL tokens) */
  amountRaw: string;
  /** Token decimals */
  decimals: number;
}

/**
 * Request parameters for getting token transfers
 */
export interface GetTransfersRequest {
  /** Solana wallet address (base58 encoded) */
  wallet: string;
  /** Maximum number of transfers to return (max: 100, default: 50) */
  limit?: number;
  /** Pagination cursor from previous response */
  cursor?: string;
}

/**
 * Response from getTransfers endpoint
 */
export interface GetTransfersResponse {
  /** Array of transfers in reverse chronological order (newest first) */
  data: Transfer[];
  /**
   * Pagination metadata.
   * Use the cursor parameter with nextCursor to fetch the next page.
   */
  pagination: {
    /** True if more results are available */
    hasMore: boolean;
    /** Cursor to fetch the next page */
    nextCursor?: string | null;
  };
}

/**
 * Wallet funding source information
 */
export interface FundingSource {
  /** Address that originally funded this wallet */
  funder: string;
  /** Name of the funder if it's a known entity (e.g., "Coinbase 2") */
  funderName: string | null;
  /** Type of the funder entity (e.g., "exchange") */
  funderType: string | null;
  /** Token mint address (So11111111111111111111111111111111111111112 for SOL) */
  mint: string;
  /** Token symbol (e.g., "SOL") */
  symbol: string;
  /** Initial funding amount (human-readable, in SOL) */
  amount: number;
  /** Raw funding amount in smallest unit (lamports for SOL) */
  amountRaw: string;
  /** Token decimals */
  decimals: number;
  /** Transaction signature of the funding transfer */
  signature: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Human-readable UTC date in ISO 8601 format */
  date: string;
  /** Slot number */
  slot: number;
  /** Solana Explorer URL for the transaction */
  explorerUrl: string;
}

/**
 * Request parameters for getting wallet funding source
 */
export interface GetFundedByRequest {
  /** Solana wallet address (base58 encoded) */
  wallet: string;
}

/**
 * Response from getFundedBy endpoint
 */
export type GetFundedByResponse = FundingSource;
