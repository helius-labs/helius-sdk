import type { ParsedEventsClient } from "./client";
import { parseTransactions } from "./parseTransactions";
import { getTransactionHistory } from "./getTransactionHistory";
import { mainnetGuard } from "./utils";
import type { ParsedEventsNetworkOptions } from "./types";

// Re-export ParsedEventsClient type for convenience
export type { ParsedEventsClient };

/**
 * Create a Parsed Events API client with eager loading
 *
 * All methods are imported immediately. This client is primarily used for testing
 * where lazy loading is not needed.
 *
 * @param apiKey - Helius API key
 * @param options - The client's `network` / `baseUrl`. Methods reject on devnet: Parsed Events is mainnet-only.
 * @returns ParsedEventsClient instance with eagerly-loaded methods
 */
export const makeParsedEventsClientEager = (
  apiKey: string,
  options: ParsedEventsNetworkOptions = {},
  userAgent?: string
): ParsedEventsClient => {
  const assertMainnet = mainnetGuard(options);

  return {
    parseTransactions: async (p) => {
      assertMainnet();
      return parseTransactions(apiKey, p, userAgent);
    },
    getTransactionHistory: async (p) => {
      assertMainnet();
      return getTransactionHistory(apiKey, p, userAgent);
    },
  };
};
