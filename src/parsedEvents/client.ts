import type {
  ParsedEventsNetworkOptions,
  ParseTransactionsRequest,
  ParseTransactionsResponse,
  GetParsedTransactionHistoryRequest,
  GetParsedTransactionHistoryResponse,
} from "./types";

/**
 * Parsed Events API client interface
 *
 * Parses transaction signatures or address history into decoded instructions,
 * transfers, and summaries using Helius's IDL catalog. Successor to the
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
  };
};
