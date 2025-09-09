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

export type Encoding = "jsonParsed" | "base58" | "base64" | "base64+zstd";

export type GetProgramAccountsV2Config = {
  commitment?: Commitment;
  minContextSlot?: number;
  withContext?: boolean;
  encoding?: Encoding;
  dataSlice?: { length: number; offset: number };
  limit?: number; // Up to 10_000
  paginationKey?: string | null; // b58 cursor; null when done
  changedSinceSlot?: number;
  filters?: ReadonlyArray<
    { dataSize: number } | { memcmp: { offset: number; bytes: string } }
  >;
};

export type GetProgramAccountsV2Request = [string, GetProgramAccountsV2Config?];

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

export type GtaV2DataSlice = { length: number; offset: number };

export type GetTokenAccountsByOwnerV2Filter = {
  mint?: string;
  programId?: string;
};

export type GetTokenAccountsByOwnerV2Config = {
  commitment?: Commitment;
  minContextSlot?: number;
  dataSlice?: GtaV2DataSlice;
  encoding?: Encoding;
  limit?: number; // Up to 10_000
  paginationKey?: string | null; // b58 cursor; null when done
  changedSinceSlot?: number;
};

export type GetTokenAccountsByOwnerV2Request = [
  string,
  GetTokenAccountsByOwnerV2Filter?,
  GetTokenAccountsByOwnerV2Config?,
];

export type GtaV2AccountInfo = {
  lamports: number;
  owner: string;
  data: any;
  executable: boolean;
  rentEpoch: number;
  space?: number;
};

export type GtaV2Account = {
  pubkey: string;
  account: GtaV2AccountInfo;
};

export type GetTokenAccountsByOwnerV2Result = {
  accounts: ReadonlyArray<GtaV2Account>;
  paginationKey: string | null;
  totalResults?: number | null;
};

export type GetTokenAccountsByOwnerV2Response =
  | GetTokenAccountsByOwnerV2Result
  | RpcResponse<GetTokenAccountsByOwnerV2Result>;
