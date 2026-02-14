import {
  BASE_URL,
  buildQueryString,
  handleResponse,
  getHeaders,
} from "./utils";
import type { GetIdentityRequest, GetIdentityResponse } from "./types";

/**
 * Get wallet identity information for known addresses
 *
 * Retrieves identity information for a wallet address if it's a known entity
 * such as an exchange, protocol, or other identified address.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet address
 * @returns Identity information if available
 * @throws Error if HTTP error or wallet identity not found (404)
 *
 * @example
 * ```ts
 * const identity = await helius.wallet.getIdentity({
 *   wallet: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664"
 * });
 * console.log(identity.name); // "Binance 1"
 * console.log(identity.category); // "Centralized Exchange"
 * ```
 */
export const getIdentity = async (
  apiKey: string,
  params: GetIdentityRequest,
  userAgent?: string
): Promise<GetIdentityResponse> => {
  const { wallet } = params;

  const queryParams = {
    "api-key": apiKey,
  };

  const url = `${BASE_URL}/${wallet}/identity${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(false, userAgent),
  });

  return handleResponse<GetIdentityResponse>(response);
};
