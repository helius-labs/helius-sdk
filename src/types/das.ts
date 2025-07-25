import {
  AssetSortBy,
  AssetSortDirection,
  Context,
  Interface,
  OwnershipModel,
  RoyaltyModel,
  Scope,
  UseMethods,
} from "./enums";
import { GetAssetResponse } from "./types";

export type TokenType =
  | "fungible"
  | "nonFungible"
  | "compressedNft"
  | "regularNft"
  | "all"
  | (string & {});

export interface Asset {
  interface: Interface;
  id: string;
  content?: Content;
  authorities?: Authorities[];
  compression?: Compression;
  grouping?: Grouping[];
  royalty?: Royalty;
  ownership: Ownership;
  creators?: Creators[];
  uses?: Uses;
  supply?: Supply;
  mutable: boolean;
  burnt: boolean;
  mint_extensions?: MintExtensions;
  token_info?: TokenInfo;
}

export interface Ownership {
  frozen: boolean;
  delegated: boolean;
  delegate?: string;
  ownership_model: OwnershipModel;
  owner: string;
}

export interface Supply {
  print_max_supply: number;
  print_current_supply: number;
  edition_nonce?: number;
}

export interface Uses {
  use_method: UseMethods;
  remaining: number;
  total: number;
}

export interface Creators {
  address: string;
  share: number;
  verified: boolean;
}

export interface Royalty {
  royalty_model: RoyaltyModel;
  target?: string;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

export interface Grouping {
  group_key: string;
  group_value: string;
  verified?: boolean;
  collection_metadata?: CollectionMetadata;
}

export interface CollectionMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  external_url?: string;
}

export interface Authorities {
  address: string;
  scopes: Scope[];
}

export interface Content {
  $schema: string;
  json_uri: string;
  files?: File[];
  metadata: Metadata;
  links?: Links;
}

export type Links = {
  external_url?: string;
  image?: string;
  animation_url?: string;
};

export interface File {
  uri?: string;
  mime?: string;
  cdn_uri?: string;
  quality?: FileQuality;
  contexts?: Context[];
}

export interface FileQuality {
  schema: string;
}

export interface Metadata {
  attributes?: Attribute[];
  description: string;
  name: string;
  symbol: string;
  token_standard?: TokenType;
}

export interface Attribute {
  value: string;
  trait_type: string;
}

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

export interface MintExtensions {
  confidential_transfer_mint?: ConfidentialTransferMint;
  confidential_transfer_fee_config?: ConfidentialTransferFeeConfig;
  transfer_fee_config?: TransferFeeConfig;
  metadata_pointer?: MetadataPointer;
  mint_close_authority?: MintCloseAuthority;
  permanent_delegate?: PermanentDelegate;
  transfer_hook?: TransferHook;
  interest_bearing_config?: InterestBearingConfig;
  default_account_state?: DefaultAccountState;
  confidential_transfer_account?: ConfidentialTransferAccount;
  metadata?: MintExtensionMetadata;
}

export interface ConfidentialTransferMint {
  authority: string;
  auto_approve_new_accounts: boolean;
  auditor_elgamal_pubkey: string;
}

export interface ConfidentialTransferFeeConfig {
  authority: string;
  withdraw_withheld_authority_elgamal_pubkey: string;
  harvest_to_mint_enabled: boolean;
  withheld_amount: string;
}

export interface TransferFeeConfig {
  transfer_fee_config_authority: string;
  withdraw_withheld_authority: string;
  withheld_amount: number;
  older_transfer_fee: OlderTransferFee;
  newer_transfer_fee: NewTransferFee;
}

export interface OlderTransferFee {
  epoch: string;
  maximum_fee: string;
  transfer_fee_basis_points: string;
}

export interface NewTransferFee {
  epoch: string;
}

export interface MetadataPointer {
  authority: string;
  metadata_address: string;
}

export interface MintCloseAuthority {
  close_authority: string;
}

export interface PermanentDelegate {
  delegate: string;
}

export interface TransferHook {
  authority: string;
  programId: string;
}

export interface InterestBearingConfig {
  rate_authority: string;
  initialization_timestamp: number;
  pre_update_average_rate: number;
  last_update_timestamp: number;
  current_rate: number;
}

export interface DefaultAccountState {
  state: string;
}

export interface ConfidentialTransferAccount {
  approved: boolean;
  elgamal_pubkey: string;
  pending_balance_lo: string;
  pending_balance_hi: string;
  available_balance: string;
  decryptable_available_balance: string;
  allow_confidential_credits: boolean;
  allow_non_confidential_credits: boolean;
  pending_balance_credit_counter: number;
  maximum_pending_balance_credit_counter: number;
  expected_pending_balance_credit_counter: number;
  actual_pending_balance_credit_counter: number;
}

export interface MintExtensionMetadata {
  updateAuthority: string;
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  additionalMetadata: AdditionalMetadata;
}

export interface AdditionalMetadata {
  key: string;
  value: string;
}

export interface TokenInfo {
  symbol?: string;
  balance?: number;
  supply?: number;
  decimals?: number;
  token_program?: string;
  associated_token_address?: string;
  price_info?: PriceInfo;
  mint_authority?: string;
  freeze_authority?: string;
}

export interface PriceInfo {
  price_per_token: number;
  currency: string;
  total_price?: number;
}

export type GetAssetsByAuthorityRequest = {
  authorityAddress: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
  options?: DisplayOptions;
  sortBy?: AssetSortingRequest;
};

export type DisplayOptions = {
  showUnverifiedCollections?: boolean;
  showCollectionMetadata?: boolean;
  showGrandTotal?: boolean;
  showRawData?: boolean;
  showFungible?: boolean;
  requireFullIndex?: boolean;
  showSystemMetadata?: boolean;
  showZeroBalance?: boolean;
  showClosedAccounts?: boolean;
  showNativeBalance?: boolean;
};

// Sorting on request (camelCase)
export type AssetSortingRequest = {
  sortBy: AssetSortBy;
  sortDirection: AssetSortDirection;
};

export type GetAssetResponseList = {
  grand_total?: number;
  total: number;
  limit: number;
  page?: number;
  cursor?: string;
  items: GetAssetResponse[];
  nativeBalance?: NativeBalanceInfo;
};

export type NativeBalanceInfo = {
  lamports: number;
  price_per_sol: number;
  total_price: number;
};

export type AssetsByCreatorRequest = {
  creatorAddress: string;
  page?: number;
  onlyVerified?: boolean;
  limit?: number;
  before?: string;
  after?: string;
  options?: DisplayOptions;
  sortBy?: AssetSortingRequest;
};

export type AssetsByGroupRequest = {
  groupValue: string;
  groupKey: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
  options?: DisplayOptions;
  sortBy?: AssetSortingRequest;
};

export type AssetsByOwnerRequest = {
  ownerAddress: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
  displayOptions?: DisplayOptions;
  sortBy?: AssetSortingRequest;
};

export interface Editions {
  mint?: string;
  edition_address?: string;
  edition?: number;
}

export interface GetNftEditionsRequest {
  mint?: string;
  page?: number;
  limit?: number;
}

export interface GetNftEditionsResponse {
  total?: number;
  limit?: number;
  page?: number;
  master_edition_address?: string;
  supply?: number;
  max_supply?: number;
  editions?: Editions[];
  burnt?: any;
}

export interface GetSignaturesForAssetRequest {
  id: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

export interface GetSignaturesForAssetResponse {
  total: number;
  limit: number;
  page?: number;
  before?: string;
  after?: string;
  items: Array<Array<string>>;
}

export interface TokenAccounts {
  address?: string;
  mint?: string;
  owner?: string;
  amount?: number;
  delegated_amount?: number;
  frozen?: boolean;
  // TODO: Add proper typing for token extensions instead of using `any`
  token_extensions: any;
};

export interface GetTokenAccountsRequest {
  mint?: string;
  owner?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  before?: string;
  after?: string;
  options?: {
    showZeroBalance?: boolean;
  };
};

export interface GetTokenAccountsResponse {
  total?: number;
  limit?: number;
  page?: number;
  cursor?: string;
  token_accounts?: TokenAccounts[];
};
