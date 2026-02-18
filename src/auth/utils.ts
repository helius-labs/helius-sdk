import { getSDKHeaders } from "../http";
import { API_URL } from "./constants";

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
