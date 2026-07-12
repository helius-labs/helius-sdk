import {
  BASE_URL,
  buildQueryString,
  handleResponse,
  getHeaders,
} from "./utils";
import type { GetBalanceAtRequest, GetBalanceAtResponse } from "./types";

/**
 * Get a wallet's balance of a specific token (or native SOL) at a point in the past
 *
 * The balance is read from the wallet's most recent transaction involving the
 * token **at or before** the requested point in time — its post-transaction
 * balance, which by definition held until the wallet's next transaction. This
 * is an exact value, not an estimate.
 *
 * The point in the past is specified as **exactly one** of `time` (Unix seconds),
 * `datetime` (string, interpreted as UTC unless an explicit timezone is given),
 * or `slot`. For exact, deterministic results prefer `slot`, since block times
 * reported by validators can drift by a few seconds.
 *
 * For native SOL, pass the pseudo-mint `So11111111111111111111111111111111111111111`
 * as `mint`.
 *
 * A wallet with no matching activity at or before the requested point is **not**
 * an error — the response has `balance: "0"` and `asOf: null`.
 *
 * Each request costs 100 credits.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet, mint, and one of time/datetime/slot
 * @returns Historical balance, returned as strings to avoid precision loss
 * @throws Error if HTTP error or invalid request
 *
 * @example
 * ```ts
 * // Balance of USDC at a specific slot (exact and deterministic)
 * const atSlot = await helius.wallet.getBalanceAt({
 *   wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
 *   mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   slot: 313000000,
 * });
 *
 * console.log(`${atSlot.balance} (raw: ${atSlot.balanceRaw})`);
 *
 * // Native SOL balance at a Unix timestamp
 * const solAt = await helius.wallet.getBalanceAt({
 *   wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
 *   mint: "So11111111111111111111111111111111111111111",
 *   time: 1736536800,
 * });
 * ```
 */
export const getBalanceAt = async (
  apiKey: string,
  params: GetBalanceAtRequest,
  userAgent?: string
): Promise<GetBalanceAtResponse> => {
  const { wallet, mint, time, datetime, slot } = params;

  const queryParams = {
    "api-key": apiKey,
    mint,
    time,
    datetime,
    slot,
  };

  const url = `${BASE_URL}/${wallet}/balance-at${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(false, userAgent),
  });

  return handleResponse<GetBalanceAtResponse>(response);
};
