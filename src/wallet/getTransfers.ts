import {
  BASE_URL,
  buildQueryString,
  handleResponse,
  getHeaders,
} from "./utils";
import type { GetTransfersRequest, GetTransfersResponse } from "./types";

/**
 * Get all token transfer activity for a given wallet
 *
 * Retrieves all token transfer activity including sender/recipient information.
 * Returns transfers in reverse chronological order (i.e., newest first).
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet address and pagination options
 * @returns Transfer activity with pagination metadata
 * @throws Error if HTTP error or invalid wallet address
 *
 * @example
 * ```ts
 * // Get first page of transfers
 * const transfers = await helius.wallet.getTransfers({
 *   wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *   limit: 50
 * });
 *
 * console.log(`Found ${transfers.data.length} transfers`);
 * transfers.data.forEach(transfer => {
 *   const direction = transfer.direction === "in" ? "received" : "sent";
 *   console.log(`${direction} ${transfer.amount} ${transfer.symbol}`);
 * });
 *
 * // Paginate to older transfers
 * if (transfers.pagination.hasMore) {
 *   const olderTransfers = await helius.wallet.getTransfers({
 *     wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *     cursor: transfers.pagination.nextCursor,
 *     limit: 50
 *   });
 * }
 * ```
 */
export const getTransfers = async (
  apiKey: string,
  params: GetTransfersRequest,
  userAgent?: string
): Promise<GetTransfersResponse> => {
  const { wallet, limit, cursor } = params;

  const queryParams = {
    "api-key": apiKey,
    limit,
    cursor,
  };

  const url = `${BASE_URL}/${wallet}/transfers${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(false, userAgent),
  });

  return handleResponse<GetTransfersResponse>(response);
};
