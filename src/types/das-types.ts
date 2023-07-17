// Types for DAS //
import {
  AssetSortBy,
  AssetSortDirection,
  Interface,
  Scope,
  Context,
  OwnershipModel,
  RoyaltyModel,
  UseMethods,
} from "./enums";

export namespace DAS { 
// getAssetsByOwner //
export interface AssetsByOwnerRequest {
  ownerAddress: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: AssetSortingRequest;
}

// getAssetsByCreator //
export type AssetsByCreatorRequest = {
  creatorAddress: string;
  page: number;
  onlyVerified?: boolean;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: AssetSortingRequest;
};
// getAssetsByGroup //
export type AssetsByGroupRequest = {
  groupValue: string;
  groupKey: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: AssetSortingRequest;
};
export type GetAssetsBatchRequest = {
  ids: string[];
};

// searchAssets
export interface SearchAssetsRequest {
  page: number; // starts at 1
  limit?: number;
  before?: string;
  after?: string;
  creatorAddress?: string;
  ownerAddress?: string;
  jsonUri?: string;
  grouping?: string;
  burnt?: boolean;
  sortBy?: AssetSortingRequest;
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
export type AssetsByAuthorityRequest = {
  authorityAddress: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
  sortBy?: AssetSortingRequest;
};
// getAsset
export type GetAssetRequest = {
  id: string | string[];
};
// getAssetProof
export type GetAssetProofRequest = {
  id: string;
};
// getSignaturesForAsset
export type GetSignaturesForAssetRequest = {
  id: string;
  page: number;
  limit?: number;
  before?: string;
  after?: string;
};

// Sorting on response
export interface AssetSorting {
  sort_by: AssetSortBy;
  sort_direction: AssetSortDirection;
}
// Sorting on request (camelCase)
export type AssetSortingRequest = {
  sortBy: AssetSortBy;
  sortDirection: AssetSortDirection;
};
// Asset Response
export type GetAssetResponse = {
  interface: Interface; // enum
  id: string;
  content?: Content;
  authorities?: Authorities;
  compression?: Compression;
  grouping?: Grouping;
  royalty?: Royalty;
  ownership: Ownership;
  creators?: Array<Creators>;
  uses?: Uses;
  supply?: Supply;
  mutable: boolean;
  burnt: boolean;
};

export type GetAssetResponseList = {
  total: number;
  limit: number;
  page: number;
  items: GetAssetResponse[];
};
export interface GetAssetProofResponse {
  root: string;
  proof: Array<string>;
  node_index: number;
  leaf: string;
  tree_id: string;
}
export interface GetSignaturesForAssetResponse {
  total: number;
  limit: number;
  page?: number;
  before?: string;
  after?: string;
  items: Array<Array<string>>;
}

// Ownership --
export interface Ownership {
  frozen: boolean;
  delegated: boolean;
  delegate?: string;
  ownership_model: OwnershipModel; // enum
  owner: string;
}
// Supply --
export interface Supply {
  print_max_supply: number;
  print_current_supply: number;
  edition_nonce?: number;
}
// Uses --
export interface Uses {
  use_method: UseMethods; // enum
  remaining: number;
  total: number;
}

// Creators --
export interface Creators {
  address: string;
  share: number;
  verified: boolean;
}
// Royalty --
export interface Royalty {
  royalty_model: RoyaltyModel;
  target?: string;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

// Grouping --
export interface Grouping {
  group_key: string;
  group_value: string;
  [Symbol.iterator](): Iterator<Grouping>;
}
// Authorities --
export interface Authorities {
  address: string;
  scopes: Array<Scope>;
  [Symbol.iterator](): Iterator<Authorities>;
}

//Links
export type Links = {
  external_url?: string;
  image?: string;
  animation_url?: string;
  [Symbol.iterator](): Iterator<Links>;
};

// Content --
export interface Content {
  $schema: string;
  json_uri: string;
  files?: Files;
  metadata: Metadata;
  links?: Links;
}

// FILE --
export interface File {
  uri?: string;
  mime?: string;
  quality?: FileQuality;
  contexts?: Context[];
  [Symbol.iterator](): Iterator<File>;
}
// FILES --
export type Files = File;
// Quality/ File --
export interface FileQuality {
  schema: string;
}
// Metadata/ Content --
export interface Metadata {
  attributes?: Attribute[];
  description: string;
  name: string;
  symbol: string;
}
// Attributes
export interface Attribute {
  value: string;
  trait_type: string;
}
// Compression
export interface Compression {
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
}
