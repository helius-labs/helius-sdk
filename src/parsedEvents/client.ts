import type {
  ParsedEventsNetworkOptions,
  ParseTransactionsRequest,
  ParseTransactionsResponse,
  GetParsedTransactionHistoryRequest,
  GetParsedTransactionHistoryResponse,
  ScanParsedTransactionHistoryRequest,
  ScanParsedTransactionHistoryResponse,
} from "./types";

/**
 * Parsed Events API client interface
 *
 * Parses transaction signatures or address history into decoded instructions,
 * transfers, and summaries using Helius's IDL catalog, and scans address
 * history server-side by program instruction or token mint. Successor to the
 * Enhanced Transactions API (`helius.enhanced`). Mainnet only.
 *
 * @example
 * ```ts
 * import { createHelius } from "helius-sdk";
 *
 * const helius = createHelius({ apiKey: "your-api-key" });
 *
 * const [result] = await helius.parsedEvents.parseTransactions({
 *   transactions: ["..."],
 * });
 *
 * const history = await helius.parsedEvents.getTransactionHistory({
 *   address: "...",
 *   limit: 50,
 * });
 *
 * const matches = await helius.parsedEvents.scan({
 *   address: "...",
 *   match: { mints: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"] },
 * });
 * ```
 */
export interface ParsedEventsClient {
  /**
   * Parse transaction signatures (max 100) into decoded instructions, transfers, and summaries
   *
   * @param params - Signatures to parse and options
   * @returns One result per input signature, in input order; check `parserStatus` per item
   * @throws Error on a request-level failure (invalid body, auth, rate limit)
   */
  parseTransactions(
    params: ParseTransactionsRequest
  ): Promise<ParseTransactionsResponse>;

  /**
   * Get parsed transaction history for an address, paginated with `paginationToken`
   *
   * @param params - Address, slot/time bounds, and pagination options
   * @returns A page of parsed transactions and the next `paginationToken`
   * @throws Error on a request-level failure (invalid body, auth, rate limit)
   */
  getTransactionHistory(
    params: GetParsedTransactionHistoryRequest
  ): Promise<GetParsedTransactionHistoryResponse>;

  /**
   * Scan an address's history server-side for transactions that call a program
   * instruction, touch a token mint, or both (when both are set, both must
   * match), returning only the parsed matches. Only successful transactions are
   * scanned unless `status` is `"any"` or `"failed"`. Paginated with
   * `paginationToken`; keep going while one is returned, even when `data` is
   * empty. Costs 10 credits plus 1 per history page scanned.
   *
   * @param params - Address, match criteria, budget, and pagination options
   * @returns Parsed matches, the next `paginationToken`, and a `scan` summary (`stoppedOn`, `creditsCharged`)
   * @throws Error on a request-level failure: `Helius HTTP 400` for an invalid body or match, auth or rate-limit errors, or `Helius HTTP 503` when at capacity or the first history page missed the request time limit
   */
  scan(
    params: ScanParsedTransactionHistoryRequest
  ): Promise<ScanParsedTransactionHistoryResponse>;
}

/**
 * Create a Parsed Events API client with lazy loading
 *
 * The implementation is dynamically imported on first use to optimize bundle size.
 * This is the default client used by `createHelius()`.
 *
 * @param apiKey - Helius API key
 * @param options - The client's `network` / `baseUrl`. Methods reject on devnet: Parsed Events is mainnet-only.
 * @returns ParsedEventsClient instance with lazy-loaded methods
 *
 * @example
 * ```ts
 * import { makeParsedEventsClient } from "helius-sdk/parsedEvents/client";
 *
 * const parsedEvents = makeParsedEventsClient("your-api-key");
 * const results = await parsedEvents.parseTransactions({ transactions: ["..."] });
 * ```
 */
export const makeParsedEventsClient = (
  apiKey: string,
  options: ParsedEventsNetworkOptions = {},
  userAgent?: string
): ParsedEventsClient => {
  let client: Promise<ParsedEventsClient> | undefined;
  const load = () =>
    (client ??= import("./client.eager.js").then((m) =>
      m.makeParsedEventsClientEager(apiKey, options, userAgent)
    ));

  return {
    parseTransactions: async (p) => (await load()).parseTransactions(p),
    getTransactionHistory: async (p) => (await load()).getTransactionHistory(p),
    scan: async (p) => (await load()).scan(p),
  };
};
