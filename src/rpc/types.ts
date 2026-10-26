import type { Rpc, SolanaRpcApi } from "@solana/kit";
import type { ResolvedHeliusRpcApi } from "./heliusRpcApi";
import type { TransportHook } from "./transport";

/** Standard Solana RPC clients exposed by both `createHelius` and `createHeliusEager`. */
export type HeliusRpcAccess = {
  /**
   * The standard `@solana/kit` `Rpc` client. Methods return a pending
   * request; call `.send()`. It shares the JSON-RPC transport of the client's
   * other RPC methods (Helius URL, API key, SDK headers, and any `transport`
   * hook).
   *
   * Pass this to `@solana/kit` helpers and third-party libraries that expect
   * an `Rpc`, such as `fetchEncodedAccount(helius.kitRpc, address)`.
   */
  kitRpc: Rpc<SolanaRpcApi>;

  /**
   * Standard Solana RPC methods that send automatically, the same ones
   * available directly on the `createHelius` client
   * (`await helius.raw.getSlot()`, no `.send()`).
   *
   * This is not a `@solana/kit` `Rpc`: each call sends its request
   * immediately, so a kit helper given `raw` sends the request and then fails
   * when it calls `.send()`. Use `kitRpc` for kit helpers and third-party
   * libraries.
   */
  raw: ResolvedHeliusRpcApi;
};

/** Options for creating a Helius RPC client. */
export interface HeliusRpcOptions {
  /** Helius API key. Required for webhooks, Parsed Events, enhanced transactions, the Wallet API, and the Admin API. */
  apiKey?: string;
  /** Solana network to connect to. Defaults to `"mainnet"`. */
  network?: "mainnet" | "devnet";
  /** Wallet address that receives rebates for RPC usage. Appended as a query parameter. */
  rebateAddress?: string;
  /**
   * Opt in to [MEV Protect](https://www.helius.dev/docs/sending-transactions/mev-protect):
   * route transactions away from validators statistically linked to sandwich
   * attacks. Appends `mev-protect=true` to the RPC URL, so it covers every send
   * through this client (`sendTransaction`, `tx.sendSmartTransaction`,
   * `tx.broadcastTransaction`, `tx.sendTransaction`), and it is the default for
   * the Sender helpers (`tx.sendTransactionWithSender`, `tx.sendBundleWithSender`),
   * which can override it per call. Defaults to `false`.
   */
  mevProtect?: boolean;
  /** Custom RPC base URL. When provided, `network` is ignored. */
  baseUrl?: string;
  /** Custom User-Agent string appended to outgoing HTTP requests. */
  userAgent?: string;
  /**
   * Augment or replace the default RPC transport. Receives the SDK's fully
   * configured transport (Helius URL with API key, SDK headers, request-id
   * stamping) and returns the transport used for all JSON-RPC calls —
   * standard Solana RPC and DAS/Helius methods alike. Enables retries,
   * failover, logging, etc. Does not affect WebSocket subscriptions or
   * REST sub-clients (webhooks, parsedEvents, enhanced, wallet, admin, auth).
   */
  transport?: TransportHook;
}
