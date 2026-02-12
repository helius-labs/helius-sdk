import { SDK_USER_AGENT } from "../http";

/**
 * Base URL for Wallet API endpoints
 */
export const BASE_URL = "https://api.helius.xyz/v1/wallet";

/**
 * Build a query string from parameters, filtering out undefined and null values
 *
 * @param params - Object with query parameters
 * @returns Query string with leading '?' or empty string
 *
 * @example
 * ```ts
 * buildQueryString({ "api-key": "test", page: 1, unused: undefined })
 * // Returns: "?api-key=test&page=1"
 * ```
 */
export const buildQueryString = (
  params: Record<string, unknown>
): string => {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");

  return filtered ? `?${filtered}` : "";
};

/**
 * Handle fetch response with error checking
 *
 * Checks for HTTP errors and API-level errors in the response body.
 * Throws an error if either is found, otherwise returns the parsed JSON.
 *
 * @param res - Fetch Response object
 * @returns Parsed JSON response
 * @throws Error if HTTP error or API error
 *
 * @example
 * ```ts
 * const response = await fetch(url);
 * const data = await handleResponse<MyType>(response);
 * ```
 */
export const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`Helius error: ${JSON.stringify(data.error)}`);
  }

  return data as T;
};

/**
 * Get standard headers for Wallet API requests
 *
 * @param includeContentType - Whether to include Content-Type header (for POST requests)
 * @returns Headers object
 *
 * @example
 * ```ts
 * // For GET requests
 * const headers = getHeaders();
 *
 * // For POST requests
 * const headers = getHeaders(true);
 * ```
 */
export const getHeaders = (
  includeContentType = false
): Record<string, string> => {
  const headers: Record<string, string> = {
    "User-Agent": SDK_USER_AGENT,
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};
