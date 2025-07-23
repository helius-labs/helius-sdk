import type { PendingRpcRequest, SolanaRpcApi } from "@solana/kit";

import type { GetAssetApi, GetPriorityFeeEstimateApi } from "./methods";

export type HeliusCustomApi = GetAssetApi & GetPriorityFeeEstimateApi;

export type HeliusRpcApi = SolanaRpcApi & HeliusCustomApi;

// To resolve TS await issues
type Resolved<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => PendingRpcRequest<infer R> ? (...args: A) => Promise<R> : T[K];
};

export type ResolvedHeliusRpcApi = Resolved<HeliusRpcApi>;