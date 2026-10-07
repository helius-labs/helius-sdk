import { compact, postParsedEvents } from "./utils";
import type {
  ParseTransactionsRequest,
  ParseTransactionsResponse,
} from "./types";

/**
 * Parse transaction signatures into decoded instructions, transfers, and summaries
 *
 * Results come back in the same order as `transactions`, including duplicates.
 * A missing or unparseable transaction does not fail the request: its item has
 * `parserStatus: "ERROR"` and a `parserError`, so check `parserStatus` before
 * reading `parsed`. Failed transactions still parse; check
 * `parsed.transactionStatus`. Costs 10 credits per request.
 *
 * @param apiKey - Helius API key
 * @param params - Signatures to parse (max 100) and options
 * @returns One result per input signature
 * @throws Error on a request-level failure (invalid body, auth, rate limit)
 *
 * @example
 * ```ts
 * const results = await helius.parsedEvents.parseTransactions({
 *   transactions: ["5xSKzM8bvpudE521jikHqASzMr23Ms4X4ieY3K8oFPFrJWCSSgYocJmHznrR8b12voDxKDH8ykdCLXSRrx6duVLH"],
 * });
 *
 * for (const r of results) {
 *   if (r.parserStatus === "OK") console.log(r.parsed.summary?.description);
 *   else console.warn(r.signature, r.parserError.code);
 * }
 * ```
 */
export const parseTransactions = async (
  apiKey: string,
  params: ParseTransactionsRequest,
  userAgent?: string
): Promise<ParseTransactionsResponse> =>
  postParsedEvents<ParseTransactionsResponse>(
    "transactions",
    apiKey,
    compact({ ...params }),
    userAgent
  );
