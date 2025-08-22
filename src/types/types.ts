import { Asset } from "./das";
import { PriorityLevel, UiTransactionEncoding } from "./enums";

export type GetAssetRequest = {
  id: string;
  options?: {
    showFungible?: boolean;
    showUnverifiedCollections?: boolean;
    showCollectionMetadata?: boolean;
    showInscription?: boolean;
  };
};
export type GetAssetResponse = Asset;

export type GetAssetBatchRequest = {
  ids: string[];
  options?: {
    showFungible?: boolean;
    showUnverifiedCollections?: boolean;
    showCollectionMetadata?: boolean;
    showInscription?: boolean;
  };
};
export type GetAssetBatchResponse = Asset[];

export type GetAssetProofRequest = {
  id: string;
};

export interface GetAssetProofResponse {
  root: string;
  proof: Array<string>;
  node_index: number;
  leaf: string;
  tree_id: string;
  burnt?: any;
}

export type GetAssetProofBatchRequest = {
  ids: string[];
};

export type GetAssetProofBatchResponse = GetAssetProofResponse[];

export interface GetPriorityFeeEstimateRequest {
  transaction?: string;
  accountKeys?: string[];
  options?: GetPriorityFeeEstimateOptions;
}

export interface GetPriorityFeeEstimateOptions {
  priorityLevel?: PriorityLevel;
  includeAllPriorityFeeLevels?: boolean;
  transactionEncoding?: UiTransactionEncoding;
  lookbackSlots?: number;
  recommended?: boolean;
}

export interface MicroLamportPriorityFeeLevels {
  min: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
}

export interface GetPriorityFeeEstimateResponse {
  priorityFeeEstimate?: number;
  priorityFeeLevels?: MicroLamportPriorityFeeLevels;
}
