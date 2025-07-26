import type { createSolanaRpcApi, Rpc, RpcPlan } from "@solana/kit";
import { AutoSent } from "./wrapAutoSend";

// To resolve TS async type issues
type UnwrapRpcPlan<T> = T extends RpcPlan<infer U> ? U : T;

type UnwrappedRpc<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer P>
    ? (...args: A) => Promise<UnwrapRpcPlan<P>>
    : T[K];
};

export type ResolvedHeliusRpcApi = UnwrappedRpc<AutoSent<Rpc<ReturnType<typeof createSolanaRpcApi>>>>;
