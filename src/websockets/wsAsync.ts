import type {
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  Commitment,
  Address,
  Signature,
} from "@solana/kit";

import type {
  TransactionSubscribeFilter,
  TransactionSubscribeConfig,
  TransactionNotificationResult,
  EnhancedAccountSubscribeConfig,
  EnhancedAccountNotificationResult,
  EnhancedSubscription,
} from "./types";

type WsRaw = RpcSubscriptions<SolanaRpcSubscriptionsApi>;

type LogsReq = ReturnType<WsRaw["logsNotifications"]>;
type SlotReq = ReturnType<WsRaw["slotNotifications"]>;
type SignatureReq = ReturnType<WsRaw["signatureNotifications"]>;
type ProgramReq = ReturnType<WsRaw["programNotifications"]>;
type AccountReq = ReturnType<WsRaw["accountNotifications"]>;

/** Filter for `logsNotifications` — subscribe to all logs or logs mentioning a specific address. */
export type LogsFilter =
  | "all"
  | "allWithVotes"
  | Readonly<{ mentions: readonly [Address] }>;

/** Configuration options for WebSocket subscriptions. */
export type LogsConfig = Readonly<{ commitment?: Commitment }>;

/**
 * WebSocket RPC subscription client. Provides promisified access to
 * Solana's WebSocket subscriptions (logs, slots, signatures, programs, accounts)
 * and Helius Enhanced WebSocket subscriptions (transactions, accounts).
 *
 * All standard subscription methods return a `Promise` that resolves to a subscription
 * object with an async iterator.
 *
 * Enhanced methods (`transactionSubscribe`, `accountSubscribe`) use Helius Enhanced
 * WebSockets for 1.5-2x faster streaming with advanced filtering. These require a
 * Business+ plan.
 */
export interface WsAsync {
  /** Subscribe to transaction logs. */
  logsNotifications(filter: LogsFilter, config?: LogsConfig): Promise<LogsReq>;
  /** Subscribe to slot updates. */
  slotNotifications(config?: LogsConfig): Promise<SlotReq>;
  /** Subscribe to signature confirmation status. */
  signatureNotifications(
    signature: Signature | string,
    config?: LogsConfig
  ): Promise<SignatureReq>;
  /** Subscribe to program account updates. */
  programNotifications(
    ...args: Parameters<WsRaw["programNotifications"]>
  ): Promise<ProgramReq>;
  /** Subscribe to account updates. */
  accountNotifications(
    ...args: Parameters<WsRaw["accountNotifications"]>
  ): Promise<AccountReq>;

  /**
   * Subscribe to real-time transaction notifications via Helius Enhanced WebSockets.
   * Supports filtering by accounts (up to 50,000), vote/failed status, and signatures.
   * Requires a Helius Business+ plan.
   *
   * Returns an `EnhancedSubscription` that implements `AsyncIterable` for consuming
   * notifications and provides an `unsubscribe()` method.
   *
   * @example
   * ```ts
   * const sub = await helius.ws.transactionSubscribe(
   *   { accountInclude: ["EPjF..."] },
   *   { commitment: "confirmed", encoding: "jsonParsed" }
   * );
   * for await (const notif of sub) {
   *   console.log(notif.signature, notif.slot);
   * }
   * await sub.unsubscribe();
   * ```
   */
  transactionSubscribe(
    filter: TransactionSubscribeFilter,
    config?: TransactionSubscribeConfig
  ): Promise<EnhancedSubscription<TransactionNotificationResult>>;

  /**
   * Unsubscribe from a transaction subscription by its server-assigned ID.
   * Helius Enhanced WebSocket method (Business+ plan).
   */
  transactionUnsubscribe(subscriptionId: number): Promise<boolean>;

  /**
   * Subscribe to real-time account change notifications via Helius Enhanced WebSockets.
   * 1.5-2x faster than standard Solana WebSocket subscriptions.
   * Requires a Helius Business+ plan.
   *
   * Returns an `EnhancedSubscription` that implements `AsyncIterable` for consuming
   * notifications and provides an `unsubscribe()` method.
   *
   * @example
   * ```ts
   * const sub = await helius.ws.accountSubscribe("EPjF...", {
   *   encoding: "jsonParsed",
   *   commitment: "confirmed",
   * });
   * for await (const notif of sub) {
   *   console.log(notif.value.lamports);
   * }
   * await sub.unsubscribe();
   * ```
   */
  accountSubscribe(
    account: string,
    config?: EnhancedAccountSubscribeConfig
  ): Promise<EnhancedSubscription<EnhancedAccountNotificationResult>>;

  /**
   * Unsubscribe from an enhanced account subscription by its server-assigned ID.
   * Helius Enhanced WebSocket method (Business+ plan).
   */
  accountUnsubscribe(subscriptionId: number): Promise<boolean>;

  /** Manually close the underlying WebSocket connections (standard and enhanced). */
  close(): void;
}

const importWs = async () =>
  (await import("@solana/kit")).createSolanaRpcSubscriptions;

/** Create a promisified WebSocket RPC subscription client. */
export const makeWsAsync = (
  wsUrl: string,
  enhancedWsUrl?: string,
  enhancedDisabledReason?: string
): WsAsync => {
  let _raw: WsRaw | undefined;
  let _enhanced: import("./enhancedWs").EnhancedWsClient | undefined;
  let _enhancedLoading:
    | Promise<import("./enhancedWs").EnhancedWsClient>
    | undefined;
  let closed = false;

  const raw = async (): Promise<WsRaw> => {
    if (_raw) return _raw;

    const ctor = await importWs();
    _raw = ctor(wsUrl);

    return _raw;
  };

  const enhanced = async (): Promise<
    import("./enhancedWs").EnhancedWsClient
  > => {
    if (!enhancedWsUrl) {
      throw new Error(
        enhancedDisabledReason ??
          "Enhanced WebSocket subscriptions are not available."
      );
    }
    if (closed) throw new Error("WebSocket client is closed");
    if (_enhanced) return _enhanced;
    if (_enhancedLoading) return _enhancedLoading;

    _enhancedLoading = import("./enhancedWs").then(
      ({ makeEnhancedWsClient }) => {
        if (closed) {
          const client = makeEnhancedWsClient(enhancedWsUrl);
          client.close();
          throw new Error("WebSocket client is closed");
        }
        _enhanced = makeEnhancedWsClient(enhancedWsUrl);
        return _enhanced;
      }
    );

    return _enhancedLoading;
  };

  return {
    logsNotifications: (filter, config) =>
      raw().then((r) => r.logsNotifications(filter as any, config)),

    slotNotifications: (config) =>
      raw().then((r) => (r.slotNotifications as any)(config)),

    signatureNotifications: (sig, config) =>
      raw().then((r) => r.signatureNotifications(sig as Signature, config)),

    programNotifications: (...args) =>
      raw().then((r) => (r.programNotifications as any)(...args)),

    accountNotifications: (...args) =>
      raw().then((r) => (r.accountNotifications as any)(...args)),

    transactionSubscribe: (filter, config) =>
      enhanced().then((e) => e.transactionSubscribe(filter, config)),

    transactionUnsubscribe: (subscriptionId) =>
      enhanced().then((e) => e.transactionUnsubscribe(subscriptionId)),

    accountSubscribe: (account, config) =>
      enhanced().then((e) => e.accountSubscribe(account, config)),

    accountUnsubscribe: (subscriptionId) =>
      enhanced().then((e) => e.accountUnsubscribe(subscriptionId)),

    close() {
      closed = true;
      if (_enhanced) {
        _enhanced.close();
        _enhanced = undefined;
      }
      _enhancedLoading = undefined;

      if (_raw && typeof (_raw as any).dispose === "function") {
        (_raw as any).dispose();
      } else if (_raw && typeof (_raw as any).close === "function") {
        (_raw as any).close();
      }
      _raw = undefined;
    },
  };
};
