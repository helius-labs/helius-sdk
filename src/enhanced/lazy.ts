import type {
  GetEnhancedTransactionsRequest,
  GetEnhancedTransactionsResponse,
  GetEnhancedTransactionsByAddressRequest,
  GetEnhancedTransactionsByAddressResponse,
} from "./types";

/**
 * Client for the Helius Enhanced Transactions API. Parses raw transactions into human-readable format.
 *
 * @deprecated The Enhanced Transactions API is in maintenance mode. Use
 * `helius.parsedEvents` instead (mainnet-only; devnet code can keep using
 * this client). See https://www.helius.dev/docs/parsed-events/guides/migrate-from-enhanced-transactions
 */
export interface EnhancedTxClientLazy {
  /**
   * Parse one or more transactions by their signatures.
   *
   * @deprecated On mainnet, use `helius.parsedEvents.parseTransactions` instead.
   */
  getTransactions(
    params: GetEnhancedTransactionsRequest
  ): Promise<GetEnhancedTransactionsResponse>;

  /**
   * Get parsed transactions for a wallet or program address.
   *
   * @deprecated On mainnet, use `helius.parsedEvents.getTransactionHistory` instead.
   */
  getTransactionsByAddress(
    params: GetEnhancedTransactionsByAddressRequest
  ): Promise<GetEnhancedTransactionsByAddressResponse>;
}

/** @deprecated On mainnet, use `makeParsedEventsClient` from `helius-sdk/parsedEvents/client` instead. */
export const makeEnhancedTxClientLazy = (
  apiKey: string,
  network: "mainnet" | "devnet" = "mainnet",
  userAgent?: string
): EnhancedTxClientLazy => {
  const load = async () => {
    const { makeEnhancedTxClientEager } = await import("./client.eager");
    return makeEnhancedTxClientEager(apiKey, network, userAgent);
  };

  return {
    getTransactions: async (params) => (await load()).getTransactions(params),
    getTransactionsByAddress: async (params) =>
      (await load()).getTransactionsByAddress(params),
  };
};
