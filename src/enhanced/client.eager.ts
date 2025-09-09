import {
  type GetEnhancedTransactionsRequest,
  type GetEnhancedTransactionsResponse,
  type GetEnhancedTransactionsByAddressRequest,
  type GetEnhancedTransactionsByAddressResponse,
} from "./types";

export interface EnhancedTxClient {
  getTransactions: (
    params: GetEnhancedTransactionsRequest
  ) => Promise<GetEnhancedTransactionsResponse>;

  getTransactionsByAddress: (
    params: GetEnhancedTransactionsByAddressRequest
  ) => Promise<GetEnhancedTransactionsByAddressResponse>;
}

const qs = (obj: Record<string, unknown | undefined>): string => {
  const s = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");

  return s ? `?${s}` : "";
};

const handle = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      json?.error?.message ??
      json?.message ??
      res.statusText ??
      "Unknown Helius error";
    throw new Error(`Helius HTTP ${res.status}: ${message}`);
  }

  return json as T;
};

export const makeEnhancedTxClientEager = (apiKey: string): EnhancedTxClient => {
  const base = "https://api.helius.xyz/v0";

  const getTransactions: EnhancedTxClient["getTransactions"] = async ({
    transactions,
    commitment,
  }) => {
    const url = `${base}/transactions` + qs({ "api-key": apiKey, commitment });

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transactions }),
    });

    return handle<GetEnhancedTransactionsResponse>(res);
  };

  const getTransactionsByAddress: EnhancedTxClient["getTransactionsByAddress"] =
    async ({ address, before, until, commitment, source, type, limit }) => {
      const url =
        `${base}/addresses/${address}/transactions` +
        qs({
          "api-key": apiKey,
          before,
          until,
          commitment,
          source,
          type,
          limit,
        });

      const res = await fetch(url, { method: "GET" });
      return handle<GetEnhancedTransactionsByAddressResponse>(res);
    };

  return {
    getTransactions,
    getTransactionsByAddress,
  };
};
