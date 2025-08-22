import type {
  GetEnhancedTransactionsRequest,
  GetEnhancedTransactionsResponse,
  GetEnhancedTransactionsByAddressRequest,
  GetEnhancedTransactionsByAddressResponse,
} from "./types";

export interface EnhancedTxClientLazy {
  getTransactions(
    params: GetEnhancedTransactionsRequest
  ): Promise<GetEnhancedTransactionsResponse>;

  getTransactionsByAddress(
    params: GetEnhancedTransactionsByAddressRequest
  ): Promise<GetEnhancedTransactionsByAddressResponse>;
}

export const makeEnhancedTxClientLazy = (
  apiKey: string
): EnhancedTxClientLazy => {
  const load = async () => {
    const { makeEnhancedTxClientEager } = await import("./client.eager");
    return makeEnhancedTxClientEager(apiKey);
  };

  return {
    getTransactions: async (params) => (await load()).getTransactions(params),
    getTransactionsByAddress: async (params) =>
      (await load()).getTransactionsByAddress(params),
  };
};
