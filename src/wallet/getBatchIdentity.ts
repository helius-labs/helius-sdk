import {
  BASE_URL,
  buildQueryString,
  handleResponse,
  getHeaders,
} from "./utils";
import type {
  GetBatchIdentityRequest,
  GetBatchIdentityResponse,
} from "./types";

/**
 * Batch identity lookup for multiple wallet addresses
 *
 * Retrieves identity information for multiple wallet addresses in a single request.
 * Maximum 100 addresses per request.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including array of wallet addresses (max 100)
 * @returns Array of identity information for requested addresses
 * @throws Error if HTTP error or invalid request
 *
 * @example
 * ```ts
 * const identities = await helius.wallet.getBatchIdentity({
 *   addresses: [
 *     "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
 *     "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S"
 *   ]
 * });
 * identities.forEach(id => console.log(id.name));
 * ```
 */
export const getBatchIdentity = async (
  apiKey: string,
  params: GetBatchIdentityRequest,
  userAgent?: string
): Promise<GetBatchIdentityResponse> => {
  const url = `${BASE_URL}/batch-identity${buildQueryString({ "api-key": apiKey })}`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(true, userAgent), // Include Content-Type for POST
    body: JSON.stringify(params),
  });

  return handleResponse<GetBatchIdentityResponse>(response);
};
