import type { PendingRpcRequest, SolanaRpcApi } from "@solana/kit";

import type { GetAssetProofApi } from "./methods/getAssetProof";
import type { GetAssetApi } from "./methods/getAsset";
import type { GetPriorityFeeEstimateApi } from "./methods/getPriorityFeeEstimate";
import type { GetAssetBatchApi } from "./methods/getAssetBatch";
import type { GetAssetProofBatchApi } from "./methods/getAssetProofBatch";
import type { GetAssetsByAuthorityApi } from "./methods/getAssetsByAuthority";
import type { GetAssetsByCreatorApi } from "./methods/getAssetsByCreator";
import type { GetAssetsByGroupApi } from "./methods/getAssetsByGroup";

export type HeliusCustomApi = GetAssetApi & GetPriorityFeeEstimateApi & GetAssetBatchApi & GetAssetProofApi & GetAssetProofBatchApi & GetAssetsByAuthorityApi & GetAssetsByCreatorApi & GetAssetsByGroupApi;

export type HeliusRpcApi = SolanaRpcApi & HeliusCustomApi;

// To resolve TS await issues and auto-sending
type Resolved<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => PendingRpcRequest<infer R> ? (...args: A) => Promise<R> : T[K];
};

export type ResolvedHeliusRpcApi = Resolved<HeliusRpcApi>;