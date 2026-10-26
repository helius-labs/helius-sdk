import { postParsedEvents } from "./utils";
import type {
  ScanParsedTransactionHistoryRequest,
  ScanParsedTransactionHistoryResponse,
} from "./types";

/**
 * Scan an address's history for transactions that call a program instruction,
 * touch a token mint, or both, and return only the parsed matches
 *
 * The server walks the history in pages of up to 1,000 transactions and stops
 * at the first of: `limit` matches, `budget.maxScannedTransactions` scanned,
 * the end of the history or window, or the request time limit. `scan.stoppedOn`
 * says which. **Pagination is manual**: a request that stops early still
 * succeeds, possibly with an empty `data`, so keep calling with the returned
 * `paginationToken` until it is absent.
 *
 * When `match` sets both `program` and `mints`, a transaction must match both.
 * Only successful transactions are scanned unless you pass `status: "any"` or
 * `"failed"` (unlike `getTransactionHistory`, which returns both).
 *
 * Costs 10 credits plus 1 per history page scanned (a page is up to 1,000
 * transactions, so at most 20 with the default budget); each response reports
 * its charge in `scan.creditsCharged`.
 *
 * @param apiKey - Helius API key
 * @param params - Address, match criteria, budget, and pagination options
 * @returns Parsed matches, the next `paginationToken`, and a `scan` summary
 * @throws Error on a request-level failure: `Helius HTTP 400` for an invalid
 * body or match (including an instruction name not in the program's IDLs),
 * auth or rate-limit errors, or `Helius HTTP 503` when the service is at
 * capacity or the first history page missed the request time limit
 *
 * @example
 * ```ts
 * const PUMP = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
 * // Fix the window once, so it doesn't move between pages
 * const since = Math.floor(Date.now() / 1000) - 3600;
 *
 * let paginationToken: string | null | undefined;
 * let requests = 0;
 * do {
 *   const page = await helius.parsedEvents.scan({
 *     address: PUMP,
 *     match: { program: { programId: PUMP, instructions: ["buy", "sell"] } },
 *     time: { gte: since },
 *     paginationToken,
 *   });
 *   page.data.forEach((r) => console.log(r.signature));
 *   paginationToken = page.paginationToken;
 * } while (paginationToken && ++requests < 5); // cap credits on a busy address
 * ```
 */
export const scan = async (
  apiKey: string,
  params: ScanParsedTransactionHistoryRequest,
  userAgent?: string
): Promise<ScanParsedTransactionHistoryResponse> =>
  // As with getTransactionHistory, unknown fields are forwarded for the API to
  // reject; postParsedEvents drops nulls.
  postParsedEvents<ScanParsedTransactionHistoryResponse>(
    "scan",
    apiKey,
    {
      ...params,
      // An empty cursor means "start of the scan", same as no cursor
      paginationToken: params.paginationToken || undefined,
    },
    userAgent
  );
