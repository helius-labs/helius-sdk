import { getSDKHeaders } from "../http";
import { ADMIN_API_URL } from "./constants";

function getHeaderValue(
  headers: HeadersInit | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(key) ?? undefined;
  if (Array.isArray(headers)) {
    const entry = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
    return entry ? entry[1] : undefined;
  }
  const found = Object.entries(headers).find(
    ([k]) => k.toLowerCase() === key.toLowerCase()
  );
  return found ? found[1] : undefined;
}

export async function adminRequest<T>(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {},
  userAgent?: string
): Promise<T> {
  const headerApiKey = getHeaderValue(options.headers, "X-Api-Key");
  if (headerApiKey !== undefined && headerApiKey !== apiKey) {
    throw new Error(
      "X-Api-Key header in options.headers conflicts with the apiKey argument. " +
        "Remove the header or ensure it matches the apiKey passed to the client."
    );
  }

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
