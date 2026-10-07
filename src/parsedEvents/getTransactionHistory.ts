import { compact, postParsedEvents } from "./utils";
import type {
  GetParsedTransactionHistoryRequest,
  GetParsedTransactionHistoryResponse,
} from "./types";

/**
 * Get parsed transaction history for an address
 *
 * Returns up to 100 parsed transactions per page, newest first by default.
 * **Pagination is manual**: pass the returned `paginationToken` back to fetch
 * the next page; it is absent once the end of the range is reached. Filter by
 * slot or block time with `slot` / `time` bounds. Costs 10 credits per request.
 *
 * Each item has the same shape as `parseTransactions` results, so check
 * `parserStatus` before reading `parsed`.
 *
 * @param apiKey - Helius API key
 * @param params - Address, filters, and pagination options
 * @returns A page of parsed transactions and the next `paginationToken`
 * @throws Error on a request-level failure (invalid body, auth, rate limit)
 *
 * @example
 * ```ts
 * let paginationToken: string | null | undefined;
 * do {
 *   const page = await helius.parsedEvents.getTransactionHistory({
 *     address: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
 *     time: { gte: 1767225600 },
 *     paginationToken,
 *   });
 *   page.data.forEach((r) => console.log(r.signature, r.parsed?.summary?.type));
 *   paginationToken = page.paginationToken;
 * } while (paginationToken);
 * ```
 */
export const getTransactionHistory = async (
  apiKey: string,
  params: GetParsedTransactionHistoryRequest,
  userAgent?: string
): Promise<GetParsedTransactionHistoryResponse> => {
  // Unknown fields are forwarded so the API rejects them loudly (e.g. a
  // leftover enhanced `gteTime` filter) instead of silently returning
  // unfiltered history. Nulls are dropped: the API's fields are non-nullable.
  const { paginationToken, slot, time } = params;

  return postParsedEvents<GetParsedTransactionHistoryResponse>(
    "transaction-history",
    apiKey,
    compact({
      ...params,
      // An empty cursor means "first page", same as no cursor
      paginationToken: paginationToken || undefined,
      slot: slot && compact({ ...slot }),
      time: time && compact({ ...time }),
    }),
    userAgent
  );
};
