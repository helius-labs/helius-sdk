import { getSDKHeaders } from "../http";
import type { ParsedEventsNetworkOptions } from "./types";

/** Base URL for Parsed Events endpoints. Parsed Events is mainnet-only. */
const BASE_URL = "https://mainnet.helius-rpc.com/v1/parsed-events";

// A "devnet" hostname label: devnet.helius-rpc.com, abc-fast-devnet.helius-rpc.com,
// api.devnet.solana.com, my-devnet-proxy.example.com
const DEVNET_HOST = /(^|[.-])devnet([.-]|$)/;

/**
 * Build a guard that throws unless the client targets mainnet, so a devnet
 * client never silently gets mainnet data. Either signal means devnet: a
 * `network` other than `"mainnet"`, or a `baseUrl` whose host names devnet.
 * Resolved once per client, since the options cannot change.
 */
export const mainnetGuard = ({
  network = "mainnet",
  baseUrl,
}: ParsedEventsNetworkOptions): (() => void) => {
  let devnetHost = false;
  try {
    devnetHost = !!baseUrl && DEVNET_HOST.test(new URL(baseUrl).hostname);
  } catch {
    // Unparseable baseUrl: no host to classify
  }
  const mainnet = network === "mainnet" && !devnetHost;

  return () => {
    if (!mainnet) {
      throw new Error("Parsed Events is only available on mainnet.");
    }
  };
};

/**
 * Drop `undefined` and `null` fields: the API types every optional field as
 * non-nullable
 */
export const compact = (
  fields: Record<string, unknown>
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined && v !== null)
  );

/**
 * POST a JSON body to a Parsed Events endpoint and return the parsed response
 *
 * @throws Error with the HTTP status and the API's `error` message on a non-2xx response
 */
export const postParsedEvents = async <T>(
  path: string,
  apiKey: string,
  body: unknown,
  userAgent?: string
): Promise<T> => {
  const url = `${BASE_URL}/${path}?api-key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getSDKHeaders(userAgent),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      // Parsed Events returns `{ error: string }`; the RPC gateway (auth,
      // rate limits) returns a JSON-RPC style `{ error: { message } }` or a
      // bare `{ message }`
      const json = JSON.parse(text);
      const error = json?.error;
      message =
        (typeof error === "string" ? error : error?.message) ||
        json?.message ||
        res.statusText ||
        text;
    } catch {
      // Non-JSON error body (e.g. a gateway error page); keep the raw text
    }
    throw new Error(`Helius HTTP ${res.status}: ${message}`);
  }

  return (await res.json()) as T;
};
