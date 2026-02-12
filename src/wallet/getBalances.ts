import { BASE_URL, buildQueryString, handleResponse, getHeaders } from "./utils";
import type { GetBalancesRequest, GetBalancesResponse } from "./types";

/**
 * Get all token and NFT balances for a given wallet
 *
 * Retrieves token and NFT balances with USD values. Results are paginated
 * manually; the API returns up to 100 tokens per request. Results are sorted
 * by USD value in descending order.
 *
 * **Pagination:** Use the `page` parameter to fetch additional pages. The response
 * includes `pagination.hasMore` to indicate if more results are available.
 * Each request makes a single API call and costs 100 credits.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet address and pagination options
 * @returns Token and NFT balances with pagination metadata
 * @throws Error if HTTP error or invalid wallet address
 *
 * @example
 * ```ts
 * // Get first page of balances
 * const balances = await helius.wallet.getBalances({
 *   wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *   showNative: true,
 *   showNfts: false,
 *   page: 1,
 *   limit: 100
 * });
 *
 * console.log(`Total USD value: $${balances.totalUsdValue}`);
 * balances.balances.forEach(token => {
 *   console.log(`${token.symbol}: ${token.balance} ($${token.usdValue})`);
 * });
 *
 * // Paginate if more results available
 * if (balances.pagination.hasMore) {
 *   const page2 = await helius.wallet.getBalances({
 *     wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *     page: 2
 *   });
 * }
 * ```
 */
export const getBalances = async (
  apiKey: string,
  params: GetBalancesRequest
): Promise<GetBalancesResponse> => {
  const { wallet, page, limit, showZeroBalance, showNative, showNfts } = params;

  const queryParams = {
    "api-key": apiKey,
    page,
    limit,
    showZeroBalance,
    showNative,
    showNfts,
  };

  const url = `${BASE_URL}/${wallet}/balances${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse<GetBalancesResponse>(response);
};
