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

export type LogsFilter =
  | "all"
  | "allWithVotes"
  | Readonly<{ mentions: readonly [Address] }>;

export type LogsConfig = Readonly<{ commitment?: Commitment }>;

export interface WsAsync {
  logsNotifications(filter: LogsFilter, config?: LogsConfig): Promise<LogsReq>;
  slotNotifications(config?: LogsConfig): Promise<SlotReq>;
  signatureNotifications(
    signature: Signature | string,
    config?: LogsConfig
  ): Promise<SignatureReq>;
  programNotifications(
    ...args: Parameters<WsRaw["programNotifications"]>
  ): Promise<ProgramReq>;
  accountNotifications(
    ...args: Parameters<WsRaw["accountNotifications"]>
  ): Promise<AccountReq>;

  // Manually dispose the underlying WebSocket
  close(): void;
}

const importWs = async () =>
  (await import("@solana/kit")).createSolanaRpcSubscriptions;

// Promisified methods
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

    slotNotifications: (config) => raw().then((r) => (r.slotNotifications as any)(config)),

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
