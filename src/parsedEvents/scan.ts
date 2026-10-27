import { postParsedEvents } from "./utils";
import type {
  ScanParsedTransactionHistoryRequest,
  ScanParsedTransactionHistoryResponse,
  ScanReturnShape,
} from "./types";

/**
 * Scan an address's history for transactions that call one of a set of
 * programs (optionally specific instructions), touch one of a set of token
 * mints, or both, and return only the matches
 *
 * The server walks the history in pages of up to 1,000 transactions and stops
 * at the first of: `limit` matches, `budget.maxScannedTransactions` scanned,
 * the end of the history or window, or the request time limit. `scan.stoppedOn`
 * says which. **Pagination is manual**: a request that stops early still
 * succeeds, possibly with an empty `data`, so keep calling with the returned
 * `paginationToken` until it is absent.
 *
 * A transaction matches when it has an instruction of any of `match.programs`;
 * when `mints` is also set, it must have a balance of one of them too. By
 * default (`scope: "address"`) an instruction or balance only counts when it
 * involves the scanned address; `scope: "transaction"` on an entry counts it
 * anywhere in the transaction (see `ScanMatchScope`). The native SOL
 * pseudo-mint `So11111111111111111111111111111111111111111` matches lamport
 * changes instead (see `ScanMintMatch`). Only successful transactions are
 * scanned unless you pass `status: "any"` or `"failed"`.
 *
 * `returnShape` picks what comes back: the parsed matches (`transactions`, the
 * default), just their signatures and positions (`signatures`), or only the
 * number of matches (`count`, in `scan.matchedTransactions`). `signatures` and
 * `count` ignore `limit` and `rawTransaction` and cover the whole scanned range.
 *
 * Costs 10 credits plus 1 per history page scanned (a page is up to 1,000
 * transactions, so at most 20 with the default budget); each response reports
 * its charge in `scan.creditsCharged`.
 *
 * @param apiKey - Helius API key
 * @param params - Address, match criteria, return shape, budget, and pagination options
 * @returns The matches for the `returnShape`, the next `paginationToken`, and a `scan` summary
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
 *     match: { programs: [{ programId: PUMP, instructions: ["buy", "sell"] }] },
 *     time: { gte: since },
 *     paginationToken,
 *   });
 *   page.data.forEach((r) => console.log(r.signature));
 *   paginationToken = page.paginationToken;
 * } while (paginationToken && ++requests < 5); // cap credits on a busy address
 *
 * // Count matches without parsing them. Each request covers at most its
 * // budget, so sum across pages for the whole window
 * let total = 0;
 * paginationToken = undefined;
 * requests = 0;
 * do {
 *   const page = await helius.parsedEvents.scan({
 *     address: PUMP,
 *     match: { programs: [{ programId: PUMP, instructions: ["buy", "sell"] }] },
 *     time: { gte: since },
 *     returnShape: "count",
 *     paginationToken,
 *   });
 *   total += page.scan.matchedTransactions;
 *   paginationToken = page.paginationToken;
 * } while (paginationToken && ++requests < 5);
 * // `total` covers the whole window only if the loop ended without a token
 * ```
 */
export const scan = async (
  apiKey: string,
  params: ScanParsedTransactionHistoryRequest<ScanReturnShape>,
  userAgent?: string
): Promise<ScanParsedTransactionHistoryResponse<ScanReturnShape>> =>
  // As with getTransactionHistory, unknown fields are forwarded for the API to
  // reject; postParsedEvents drops nulls.
  postParsedEvents<ScanParsedTransactionHistoryResponse<ScanReturnShape>>(
    "scan",
    apiKey,
    {
      ...params,
      // An empty cursor means "start of the scan", same as no cursor
      paginationToken: params.paginationToken || undefined,
    },
    userAgent
  );
