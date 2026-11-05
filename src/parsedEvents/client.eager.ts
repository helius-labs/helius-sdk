import type { ParsedEventsClient } from "./client.js";
import { parseTransactions } from "./parseTransactions.js";
import { getTransactionHistory } from "./getTransactionHistory.js";
import { scan } from "./scan.js";
import { mainnetGuard } from "./utils.js";
import type {
  ParsedEventsNetworkOptions,
  ScanParsedTransactionHistoryRequest,
  ScanReturnShape,
} from "./types.js";

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
    scan: (async (p: ScanParsedTransactionHistoryRequest<ScanReturnShape>) => {
      assertMainnet();
      return scan(apiKey, p, userAgent);
    }) as ParsedEventsClient["scan"],
  };
};
