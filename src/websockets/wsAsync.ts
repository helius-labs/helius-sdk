import type {
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  Commitment,
  Address,
  Signature,
} from "@solana/kit";

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
 * Solana's WebSocket subscriptions (logs, slots, signatures, programs, accounts).
 *
 * All subscription methods return a `Promise` that resolves to a subscription
 * object with an async iterator.
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

  /** Manually close the underlying WebSocket connection. */
  close(): void;
}

const importWs = async () =>
  (await import("@solana/kit")).createSolanaRpcSubscriptions;

/** Create a promisified WebSocket RPC subscription client. */
export const makeWsAsync = (wsUrl: string): WsAsync => {
  let _raw: WsRaw | undefined;

  const raw = async (): Promise<WsRaw> => {
    if (_raw) return _raw;

    const ctor = await importWs();
    _raw = ctor(wsUrl);

    return _raw;
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

    close() {
      // `@solana/kit` exposes `.dispose()`; but we fall back to `.close()` or noop
      if (_raw && typeof (_raw as any).dispose === "function") {
        (_raw as any).dispose();
      } else if (_raw && typeof (_raw as any).close === "function") {
        (_raw as any).close();
      }
      _raw = undefined;
    },
  };
};
