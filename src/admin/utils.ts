import { getSDKHeaders } from "../http";
import { ADMIN_API_URL } from "./constants";

export async function adminRequest<T>(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {},
  userAgent?: string
): Promise<T> {
  const url = `${ADMIN_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getSDKHeaders(userAgent),
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
