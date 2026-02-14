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
export const makeWalletClientEager = (apiKey: string): WalletClient => ({
  getIdentity: (p: GetIdentityRequest): Promise<GetIdentityResponse> =>
    getIdentity(apiKey, p),
  getBatchIdentity: (
    p: GetBatchIdentityRequest
  ): Promise<GetBatchIdentityResponse> => getBatchIdentity(apiKey, p),
  getBalances: (p: GetBalancesRequest): Promise<GetBalancesResponse> =>
    getBalances(apiKey, p),
  getHistory: (p: GetHistoryRequest): Promise<GetHistoryResponse> =>
    getHistory(apiKey, p),
  getTransfers: (p: GetTransfersRequest): Promise<GetTransfersResponse> =>
    getTransfers(apiKey, p),
  getFundedBy: (p: GetFundedByRequest): Promise<GetFundedByResponse> =>
    getFundedBy(apiKey, p),
});
