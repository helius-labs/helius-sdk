import type { WalletClient } from "./client";
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
import { getIdentity } from "./getIdentity";
import { getBatchIdentity } from "./getBatchIdentity";
import { getBalances } from "./getBalances";
import { getHistory } from "./getHistory";
import { getTransfers } from "./getTransfers";
import { getFundedBy } from "./getFundedBy";

// Re-export WalletClient type for convenience
export type { WalletClient };

/**
 * Create a Wallet API client with eager loading
 *
 * All methods are imported immediately. This client is primarily used for testing
 * where lazy loading is not needed.
 *
 * @param apiKey - Helius API key
 * @returns WalletClient instance with eagerly-loaded methods
 *
 * @example
 * ```ts
 * import { makeWalletClientEager } from "helius-sdk/wallet/client.eager";
 *
 * const walletClient = makeWalletClientEager("your-api-key");
 * const identity = await walletClient.getIdentity({ wallet: "..." });
 * ```
 */
export const makeWalletClientEager = (
  apiKey: string,
  userAgent?: string
): WalletClient => ({
  getIdentity: (p: GetIdentityRequest): Promise<GetIdentityResponse> =>
    getIdentity(apiKey, p, userAgent),
  getBatchIdentity: (
    p: GetBatchIdentityRequest
  ): Promise<GetBatchIdentityResponse> => getBatchIdentity(apiKey, p, userAgent),
  getBalances: (p: GetBalancesRequest): Promise<GetBalancesResponse> =>
    getBalances(apiKey, p, userAgent),
  getHistory: (p: GetHistoryRequest): Promise<GetHistoryResponse> =>
    getHistory(apiKey, p, userAgent),
  getTransfers: (p: GetTransfersRequest): Promise<GetTransfersResponse> =>
    getTransfers(apiKey, p, userAgent),
  getFundedBy: (p: GetFundedByRequest): Promise<GetFundedByResponse> =>
    getFundedBy(apiKey, p, userAgent),
});
