import type { PendingRpcRequest, SolanaRpcApi } from "@solana/kit";
import type {
  GetAssetBatchRequest,
  GetAssetBatchResponse,
  GetAssetProofBatchRequest,
  GetAssetProofBatchResponse,
  GetAssetProofRequest,
  GetAssetProofResponse,
  GetAssetRequest,
  GetAssetResponse,
  GetPriorityFeeEstimateRequest,
  GetPriorityFeeEstimateResponse,
} from "../types";
import type {
  GetAssetsByAuthorityRequest,
  GetAssetResponseList,
  AssetsByCreatorRequest,
  AssetsByGroupRequest,
} from "../types/das";

export interface HeliusCustomApi {
  getAsset(params: GetAssetRequest): PendingRpcRequest<GetAssetResponse>;
  getAssetBatch(
    params: GetAssetBatchRequest
  ): PendingRpcRequest<GetAssetBatchResponse>;
  getAssetProof(
    params: GetAssetProofRequest
  ): PendingRpcRequest<GetAssetProofResponse>;
  getAssetProofBatch(
    params: GetAssetProofBatchRequest
  ): PendingRpcRequest<GetAssetProofBatchResponse>;
  getAssetsByAuthority(
    params: GetAssetsByAuthorityRequest
  ): PendingRpcRequest<GetAssetResponseList>;
  getAssetsByCreator(
    params: AssetsByCreatorRequest
  ): PendingRpcRequest<GetAssetResponseList>;
  getAssetsByGroup(
    params: AssetsByGroupRequest
  ): PendingRpcRequest<GetAssetResponseList>;
  getPriorityFeeEstimate(
    params: GetPriorityFeeEstimateRequest
  ): PendingRpcRequest<GetPriorityFeeEstimateResponse>;
}

export type HeliusRpcApi = SolanaRpcApi & HeliusCustomApi;

// To resolve TS await issues and auto-sending
type Resolved<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => PendingRpcRequest<infer R>
    ? (...args: A) => Promise<R>
    : T[K];
};

export type ResolvedHeliusRpcApi = Resolved<HeliusRpcApi>;
