// Types for DAS

import {
  AssetSortBy,
  AssetSortDirection,
  DASInterface,
  DASScope,
  DasContext,
  OwnershipModel,
  RoyaltyModel,
  UseMethods,
} from "./enums";

export type DASOption<T> = T | null;

// getAssetsByOwner //
export interface AssetsByOwner {
  ownerAddress: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: DASAssetSortingRequest;
}

// getAssetsByCreator //
export type AssetsByCreator = {
  creatorAddress: string;
  page: number;
  onlyVerified?: boolean;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: DASAssetSortingRequest;
};
// getAssetsByGroup //
export type AssetsByGroup = {
  groupValue: string;
  groupKey: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: DASAssetSortingRequest;
};

// searchAssets
export interface SearchAssets {
  page: number; // starts at 1
  limit?: number;
  before?: string;
  after?: string;
  creatorAddress?: string;
  ownerAddress?: string;
  jsonUri?: string;
  grouping?: string;
  burnt?: boolean;
  sortBy?: DASAssetSortingRequest;
  frozen?: boolean;
  supplyMint?: string;
  supply?: number;
  interface?: string;
  delegate?: number;
  ownerType?: OwnershipModel;
  royaltyAmount?: number;
  royaltyTarget?: string;
  royaltyTargetType?: RoyaltyModel;
  compressible?: boolean;
  compressed?: boolean;
}

// getAssetsByAuthority
export type AssetsByAuthority = {
  authorityAddress: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: DASAssetSortingRequest;
};
// getAsset
export type GetAsset = {
  id: string;
};
// getAssetProof
export type GetAssetProof = {
  id: string;
};
// getSignaturesForAsset
export type GetSignaturesForAsset = {
  id: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
};

// Sorting on response
export interface DASAssetSorting {
  sort_by: AssetSortBy;
  sort_direction: AssetSortDirection;
}
// Sorting on request (camelCase)
export type DASAssetSortingRequest = {
  sortBy: AssetSortBy;
  sortDirection: AssetSortDirection;
};
// Asset Response
export type getAssetResponse = {
  interface: DASInterface; // enum
  id: string;
  content: DASOption<DASContent>;
  authorities: DASOption<DASAuthorities>;
  compression: DASOption<DASCompression>;
  grouping: DASOption<DASGrouping>;
  royalty: DASOption<DASRoyalty>;
  ownership: DASOwnership;
  creators: DASOption<Array<DASCreators>>;
  uses: DASOption<DASUses>;
  supply: DASOption<DASSupply>;
  mutable: boolean;
  burnt: boolean;
};

export type getAssetResponseList = {
  total: number;
  limit: number;
  page: number;
  items: getAssetResponse[];
};
export interface getAssetProofResponse {
  root: string;
  proof: Array<string>;
  node_index: number;
  leaf: string;
  tree_id: string;
}
export interface getSignatureResponse {
  total: number;
  limit: number;
  page: DASOption<number>;
  before: DASOption<string>;
  after: DASOption<string>;
  items: Array<Array<string>>;
}

// Ownership --
export interface DASOwnership {
  frozen: boolean;
  delegated: boolean;
  delegate: DASOption<string>;
  ownership_model: OwnershipModel; // enum
  owner: string;
}
// Supply --
export interface DASSupply {
  print_max_supply: number;
  print_current_supply: number;
  edition_nonce: DASOption<number>;
}
// Uses --
export interface DASUses {
  use_method: UseMethods; // enum
  remaining: number;
  total: number;
}

// Creators --
export interface DASCreators {
  address: string;
  share: number;
  verified: boolean;
}
// Royalty --
export interface DASRoyalty {
  royalty_model: RoyaltyModel;
  target: DASOption<string>;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

// Grouping --
export interface DASGrouping {
  group_key: string;
  group_value: string;
  [Symbol.iterator](): Iterator<DASGrouping>;
}
// Authorities --
export interface DASAuthorities {
  address: string;
  scopes: Array<DASScope>;
  [Symbol.iterator](): Iterator<DASAuthorities>;
}

//Links
export type DASLinks = {
  external_url: DASOption<string>;
  image: DASOption<string>;
  animation_url: DASOption<string>;
  [Symbol.iterator](): Iterator<DASLinks>;
};

// Content --
export interface DASContent {
  $schema: string;
  json_uri: string;
  files: DASOption<DASFiles>;
  metadata: DASMetadata;
  links: DASOption<DASLinks>;
}

// FILE --
export interface DASFile {
  uri: DASOption<string>;
  mime: DASOption<string>;
  quality: DASOption<DASFileQuality>;
  contexts: DASOption<DasContext[]>;
  [Symbol.iterator](): Iterator<DASFile>;
}
// FILES --
export type DASFiles = DASOption<DASFile>;
// Quality/ File --
export interface DASFileQuality {
  schema: string;
}
// Metadata/ Content --
export interface DASMetadata {
  attributes?: DASAttribute[];
  description: string;
  name: string;
  symbol: string;
}
// Attributes
export interface DASAttribute {
  value: string;
  trait_type: string;
}
// Compression
export interface DASCompression {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}
// End of DAS
