import {
  createSolanaRpcSubscriptions,
  type RpcSubscriptions,
  type SolanaRpcSubscriptionsApi,
  type Commitment,
  type Address,
  type Signature,
} from "@solana/kit";

type WsRaw = RpcSubscriptions<SolanaRpcSubscriptionsApi>;

type LogsReq = ReturnType<WsRaw["logsNotifications"]>;
type SlotReq = ReturnType<WsRaw["slotNotifications"]>;
type SignatureReq = ReturnType<WsRaw["signatureNotifications"]>;
type ProgramReq = ReturnType<WsRaw["programNotifications"]>;
type AccountReq = ReturnType<WsRaw["accountNotifications"]>;

type LogsFilter =
  | "all"
  | "allWithVotes"
  | Readonly<{ mentions: readonly [Address] }>;
type LogsConfig = Readonly<{ commitment?: Commitment }>;

// Promisified methods
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
}

export const makeWsAsync = (wsUrl: string): WsAsync => {
  let _raw: WsRaw | undefined;
  const raw = (): WsRaw => (_raw ??= createSolanaRpcSubscriptions(wsUrl));

  return {
    logsNotifications: async (filter, config) =>
      raw().logsNotifications(filter as any, config),
    slotNotifications: async () => raw().slotNotifications(),
    signatureNotifications: async (sig, config) => {
      const branded = sig as Signature;
      return raw().signatureNotifications(branded, config);
    },
    programNotifications: async (...args) =>
      (raw().programNotifications as any)(...args),
    accountNotifications: async (...args) =>
      (raw().accountNotifications as any)(...args),
  };
};
