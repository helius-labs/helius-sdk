import { getSDKHeaders } from "../http";
import { API_URL } from "./constants";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves the API root at call time. Honors `process.env.HELIUS_API_URL` when
 * available (Node), falls back to the literal `API_URL` constant otherwise.
 * Trailing slashes are stripped so `…/v0/` and `…/v0` behave identically, and
 * the `/v0` version prefix is auto-appended when missing — so a `HELIUS_API_URL`
 * override set without it still resolves to versioned endpoints.
 */
function resolveApiUrl(): string {
  const override =
    typeof process !== "undefined" && process.env?.HELIUS_API_URL
      ? process.env.HELIUS_API_URL
      : API_URL;
  const url = override.replace(/\/$/, "");
  return url.endsWith("/v0") ? url : `${url}/v0`;
}

export async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  userAgent?: string
): Promise<T> {
  const url = `${resolveApiUrl()}${endpoint}`;
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
    // Guard the headers access — some fetch mocks in tests omit Headers entirely.
    const contentType = response.headers?.get?.("content-type") ?? "";
    if (contentType.startsWith("application/json")) {
      try {
        const body = JSON.parse(errorText);
        const message = body.error_description || body.error || errorText;
        const err = new Error(message) as Error & {
          code?: string;
          status?: number;
        };
        if (typeof body.error === "string") err.code = body.error;
        err.status = response.status;
        throw err;
      } catch (parseErr) {
        if (parseErr instanceof Error && (parseErr as any).status !== undefined)
          throw parseErr;
        // JSON parse failed — fall through to generic.
      }
    }
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
