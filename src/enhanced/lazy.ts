import type {
  GetEnhancedTransactionsRequest,
  GetEnhancedTransactionsResponse,
  GetEnhancedTransactionsByAddressRequest,
  GetEnhancedTransactionsByAddressResponse,
} from "./types";

/** Client for the Helius Enhanced Transactions API. Parses raw transactions into human-readable format. */
export interface EnhancedTxClientLazy {
  /** Parse one or more transactions by their signatures. */
  getTransactions(
    params: GetEnhancedTransactionsRequest
  ): Promise<GetEnhancedTransactionsResponse>;

  /** Get parsed transactions for a wallet or program address. */
  getTransactionsByAddress(
    params: GetEnhancedTransactionsByAddressRequest
  ): Promise<GetEnhancedTransactionsByAddressResponse>;
}

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
