import {
  type GetEnhancedTransactionsRequest,
  type GetEnhancedTransactionsResponse,
  type GetEnhancedTransactionsByAddressRequest,
  type GetEnhancedTransactionsByAddressResponse,
} from "./types";
import { getSDKHeaders } from "../http";

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

export const makeEnhancedTxClientEager = (
  apiKey: string,
  network: "mainnet" | "devnet" = "mainnet",
  userAgent?: string
): EnhancedTxClient => {
  const base =
    network === "devnet"
      ? "https://api-devnet.helius.xyz/v0"
      : "https://api.helius.xyz/v0";

  const getTransactions: EnhancedTxClient["getTransactions"] = async ({
    transactions,
    commitment,
  }) => {
    const url = `${base}/transactions` + qs({ "api-key": apiKey, commitment });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getSDKHeaders(userAgent),
      },
      body: JSON.stringify({ transactions }),
    });

    return handle<GetEnhancedTransactionsResponse>(res);
  };

  const getTransactionsByAddress: EnhancedTxClient["getTransactionsByAddress"] =
    async ({
      address,
      beforeSignature,
      afterSignature,
      commitment,
      source,
      type,
      limit,
      gtSlot,
      gteSlot,
      ltSlot,
      lteSlot,
      gtTime,
      gteTime,
      ltTime,
      lteTime,
      sortOrder,
    }) => {
      const url =
        `${base}/addresses/${address}/transactions` +
        qs({
          "api-key": apiKey,
          "before-signature": beforeSignature,
          "after-signature": afterSignature,
          commitment,
          source,
          type,
          limit,
          "gt-slot": gtSlot,
          "gte-slot": gteSlot,
          "lt-slot": ltSlot,
          "lte-slot": lteSlot,
          "gt-time": gtTime,
          "gte-time": gteTime,
          "lt-time": ltTime,
          "lte-time": lteTime,
          "sort-order": sortOrder,
        });

      const res = await fetch(url, {
        method: "GET",
        headers: getSDKHeaders(userAgent),
      });
      return handle<GetEnhancedTransactionsByAddressResponse>(res);
    };

  return {
    getTransactions,
    getTransactionsByAddress,
  };
};
