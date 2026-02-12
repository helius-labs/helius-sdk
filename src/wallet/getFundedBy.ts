import { BASE_URL, buildQueryString, handleResponse, getHeaders } from "./utils";
import type { GetFundedByRequest, GetFundedByResponse } from "./types";

/**
 * Get the original funding source of a given wallet
 *
 * Discovers the original funding source of a wallet by analyzing its first incoming
 * SOL transfer. Useful for identifying if a wallet was funded by an exchange, another
 * wallet, etc.
 *
 * @beta The Wallet API is currently in beta. APIs and response formats may change.
 *
 * @param apiKey - Helius API key
 * @param params - Request parameters including wallet address
 * @returns Funding source information
 * @throws Error if HTTP error, wallet not found, or no funding transaction found (404)
 *
 * @example
 * ```ts
 * const fundedBy = await helius.wallet.getFundedBy({
 *   wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY"
 * });
 *
 * console.log(`Funded by: ${fundedBy.funder}`);
 * if (fundedBy.funderName) {
 *   console.log(`Funder name: ${fundedBy.funderName}`);
 *   console.log(`Funder type: ${fundedBy.funderType}`);
 * }
 * console.log(`Initial funding: ${fundedBy.amount} ${fundedBy.symbol}`);
 * console.log(`Explorer: ${fundedBy.explorerUrl}`);
 * ```
 */
export const getFundedBy = async (
  apiKey: string,
  params: GetFundedByRequest
): Promise<GetFundedByResponse> => {
  const { wallet } = params;

  const queryParams = {
    "api-key": apiKey,
  };

  const url = `${BASE_URL}/${wallet}/funded-by${buildQueryString(queryParams)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse<GetFundedByResponse>(response);
};
