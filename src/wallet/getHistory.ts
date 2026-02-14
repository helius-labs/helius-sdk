import {
  BASE_URL,
  buildQueryString,
  handleResponse,
  getHeaders,
} from "./utils";
import type { GetHistoryRequest, GetHistoryResponse } from "./types";

/**
 * Get transaction history for a given wallet
 *
 * Retrieves a parsed transaction history using our internal parsers. Returns
 * human-readable, parsed transactions with balance changes for each transaction.
 * **Pagination is manual** - the API returns up to 100 transactions per request.
 *
 * Returns transactions in reverse chronological order (i.e., newest first).
 *
 * **Associated Token Accounts (ATAs):** The `tokenAccounts` parameter controls whether
 * transactions involving token accounts owned by the wallet are included:
 * - `balanceChanged` (recommended): Includes transactions that changed token account balances, filtering spam
 * - `none`: Only direct wallet interactions
 * - `all`: All token account transactions including spam
 *
 * **Pagination:** Use the `before` parameter with `pagination.nextCursor` to fetch the
 * next page. The response includes `pagination.hasMore` to indicate if more results are
 * available. Each request makes a single API call and costs 100 credits.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet address and pagination options
 * @returns Transaction history with balance changes and pagination metadata
 * @throws Error if HTTP error or invalid wallet address
 *
 * @example
 * ```ts
 * // Get first page of history
 * const history = await helius.wallet.getHistory({
 *   wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *   limit: 50,
 *   tokenAccounts: "balanceChanged"
 * });
 *
 * console.log(`Found ${history.data.length} transactions`);
 * history.data.forEach(tx => {
 *   console.log(`${tx.signature}: ${tx.balanceChanges.length} balance changes`);
 * });
 *
 * // Paginate to older transactions
 * if (history.pagination.hasMore) {
 *   const olderTxs = await helius.wallet.getHistory({
 *     wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *     before: history.pagination.nextCursor,
 *     limit: 50
 *   });
 * }
 * ```
 */
export const getHistory = async (
  apiKey: string,
  params: GetHistoryRequest,
  userAgent?: string
): Promise<GetHistoryResponse> => {
  const { wallet, limit, before, after, type, tokenAccounts } = params;

  const queryParams = {
    "api-key": apiKey,
    limit,
    before,
    after,
    type,
    tokenAccounts,
  };

  const url = `${BASE_URL}/${wallet}/history${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(false, userAgent),
  });

  return handleResponse<GetHistoryResponse>(response);
};
