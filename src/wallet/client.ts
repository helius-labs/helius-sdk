import type {
  GetIdentityRequest,
  GetIdentityResponse,
  GetBatchIdentityRequest,
  GetBatchIdentityResponse,
  GetBalancesRequest,
  GetBalancesResponse,
  GetHistoryRequest,
  GetHistoryResponse,
  GetTransfersRequest,
  GetTransfersResponse,
  GetFundedByRequest,
  GetFundedByResponse,
} from "./types";

/**
 * Wallet API client interface
 *
 * Provides methods for querying Solana wallet data including identity, balances,
 * transaction history, transfers, and funding sources.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @example
 * ```ts
 * import { createHelius } from "helius-sdk";
 *
 * const helius = createHelius({ apiKey: "your-api-key" });
 *
 * // Get wallet identity
 * const identity = await helius.wallet.getIdentity({ wallet: "..." });
 *
 * // Get balances
 * const balances = await helius.wallet.getBalances({ wallet: "..." });
 *
 * // Get transaction history
 * const history = await helius.wallet.getHistory({ wallet: "...", limit: 50 });
 * ```
 */
export interface WalletClient {
  /**
   * Get wallet identity information for known addresses
   *
   * @param params - Request parameters including wallet address
   * @returns Identity information if available
   * @throws Error if HTTP error or wallet identity not found (404)
   */
  getIdentity(params: GetIdentityRequest): Promise<GetIdentityResponse>;

  /**
   * Batch identity lookup for multiple wallet addresses (max 100)
   *
   * @param params - Request parameters including array of wallet addresses
   * @returns Array of identity information for requested addresses
   * @throws Error if HTTP error or invalid request
   */
  getBatchIdentity(
    params: GetBatchIdentityRequest
  ): Promise<GetBatchIdentityResponse>;

  /**
   * Get all token and NFT balances for a wallet with pagination
   *
   * @param params - Request parameters including wallet address and pagination options
   * @returns Token and NFT balances with pagination metadata
   * @throws Error if HTTP error or invalid wallet address
   */
  getBalances(params: GetBalancesRequest): Promise<GetBalancesResponse>;

  /**
   * Get transaction history with balance changes
   *
   * @param params - Request parameters including wallet address and pagination options
   * @returns Transaction history with pagination metadata
   * @throws Error if HTTP error or invalid wallet address
   */
  getHistory(params: GetHistoryRequest): Promise<GetHistoryResponse>;

  /**
   * Get all token transfer activity for a wallet
   *
   * @param params - Request parameters including wallet address and pagination options
   * @returns Transfer activity with pagination metadata
   * @throws Error if HTTP error or invalid wallet address
   */
  getTransfers(params: GetTransfersRequest): Promise<GetTransfersResponse>;

  /**
   * Get the original funding source of a wallet
   *
   * @param params - Request parameters including wallet address
   * @returns Funding source information
   * @throws Error if HTTP error or no funding transaction found (404)
   */
  getFundedBy(params: GetFundedByRequest): Promise<GetFundedByResponse>;
}

/**
 * Create a Wallet API client with lazy loading
 *
 * Methods are dynamically imported on first use to optimize bundle size.
 * This is the default client used by `createHelius()`.
 *
 * @param apiKey - Helius API key
 * @returns WalletClient instance with lazy-loaded methods
 *
 * @example
 * ```ts
 * import { makeWalletClient } from "helius-sdk/wallet/client";
 *
 * const walletClient = makeWalletClient("your-api-key");
 * const identity = await walletClient.getIdentity({ wallet: "..." });
 * ```
 */
export const makeWalletClient = (
  apiKey: string,
  userAgent?: string
): WalletClient => ({
  getIdentity: async (p) =>
    (await import("./getIdentity.js")).getIdentity(apiKey, p, userAgent),
  getBatchIdentity: async (p) =>
    (await import("./getBatchIdentity.js")).getBatchIdentity(apiKey, p, userAgent),
  getBalances: async (p) =>
    (await import("./getBalances.js")).getBalances(apiKey, p, userAgent),
  getHistory: async (p) =>
    (await import("./getHistory.js")).getHistory(apiKey, p, userAgent),
  getTransfers: async (p) =>
    (await import("./getTransfers.js")).getTransfers(apiKey, p, userAgent),
  getFundedBy: async (p) =>
    (await import("./getFundedBy.js")).getFundedBy(apiKey, p, userAgent),
});
