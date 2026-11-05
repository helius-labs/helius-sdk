import { getSDKHeaders } from "../http.js";
import { ADMIN_API_URL } from "./constants.js";

export async function adminRequest<T>(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {},
  userAgent?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  const headerApiKey = headers.get("X-Api-Key");
  if (headerApiKey !== null && headerApiKey !== apiKey) {
    throw new Error(
      "X-Api-Key header in options.headers conflicts with the apiKey argument. " +
        "Remove the header or ensure it matches the apiKey passed to the client."
    );
  }

  for (const [name, value] of Object.entries({
    ...getSDKHeaders(userAgent),
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  })) {
    if (!headers.has(name)) headers.set(name, value);
  }

  const url = `${ADMIN_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
