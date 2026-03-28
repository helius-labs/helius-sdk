import { getSDKHeaders } from "../http";
import { API_URL } from "./constants";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract the HTTP status code from an SDK API error message.
 * Returns `undefined` if the error does not match the `"API error (NNN)"` pattern.
 */
export const getHttpStatus = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined;
  const match = error.message.match(/API error \((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
};

export async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  userAgent?: string
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getSDKHeaders(userAgent),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
