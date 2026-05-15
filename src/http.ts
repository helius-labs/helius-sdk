import type { createDefaultRpcTransport } from "@solana/kit";
import { version } from "./version";

const getEnvironment = (): "web" | "server" =>
  typeof window !== "undefined" ? "web" : "server";

export const SDK_USER_AGENT = `helius-node-sdk/${version} (${getEnvironment()})`;

/**
 * Header shape accepted by `@solana/kit`'s `createDefaultRpcTransport` —
 * a structural subset of `Record<string, string>` that forbids browser-
 * reserved headers (Proxy-*, Sec-*, etc.). Derived from kit's exported
 * function signature so we don't need a direct dep on
 * `@solana/rpc-transport-http`. The `?: never` markers in kit's type
 * don't survive object spread, so RPC transport call sites pass the
 * result of `getSDKHeaders` cast to this type; `fetch()`-based call
 * sites use the plain `Record<string, string>` return shape directly.
 */
export type AllowedRpcHeaders = NonNullable<
  Parameters<typeof createDefaultRpcTransport>[0]["headers"]
>;

/**
 * Sanitize a client identifier string, stripping non-printable ASCII.
 * Returns the cleaned string or `undefined` if nothing usable remains.
 */
export const sanitizeClient = (raw: string): string | undefined => {
  const sanitized = raw.replace(/[^\x20-\x7E]/g, "").trim();
  return sanitized || undefined;
};

/**
 * Build the standard SDK headers.
 *
 * - `User-Agent` is always the SDK identifier (e.g. `helius-node-sdk/2.1.0 (server)`).
 * - When a consumer `clientId` is provided (e.g. `helius-mcp/0.3.0`), it is sent
 *   as the `X-Helius-Client` header instead of being stacked in `User-Agent`.
 */
export const getSDKHeaders = (clientId?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "User-Agent": SDK_USER_AGENT,
  };

  if (clientId) {
    const sanitized = sanitizeClient(clientId);
    if (sanitized) {
      headers["X-Helius-Client"] = sanitized;
    }
  }

  return headers;
};
