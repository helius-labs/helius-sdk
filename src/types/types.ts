import type { Commitment, RpcResponse } from "@solana/kit";

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

export type GetProgramAccountsV2Config = {
  commitment?: Commitment;
  minContextSlot?: number;
  withContext?: boolean;
  encoding?: "jsonParsed" | "base58" | "base64" | "base64+zstd";
  dataSlice?: { length: number; offset: number };
  limit?: number; // Up to 10_000
  paginationKey?: string | null; // b58 cursor
  changedSinceSlot?: number;
  filters?: ReadonlyArray<
    | { dataSize: number }
    | { memcmp: { offset: number; bytes: string } }
  >;
};

export type GetProgramAccountsV2Request = [
  string,
  GetProgramAccountsV2Config?
];

export type GpaV2AccountInfo = {
  lamports: number;
  owner: string;
  data: any;    
  executable: boolean;
  rentEpoch: number;
  space?: number;
};

export type GpaV2Account = {
  pubkey: string;
  account: GpaV2AccountInfo;
};

export type GetProgramAccountsV2Result = {
  accounts: ReadonlyArray<GpaV2Account>;
  paginationKey: string | null;
  totalResults?: number | null;
};

export type GetProgramAccountsV2Response =
  | GetProgramAccountsV2Result
  | RpcResponse<GetProgramAccountsV2Result>;
  