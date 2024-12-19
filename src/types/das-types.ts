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
} from './enums';
import { FullRwaAccount } from './types';

export namespace DAS {
  // getAssetsByOwner //
  export interface AssetsByOwnerRequest {
    ownerAddress: string;
    page: number;
    limit?: number;
    before?: string;
    after?: string;
    displayOptions?: DisplayOptions;
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
    displayOptions?: DisplayOptions;
    sortBy?: AssetSortingRequest;
  };

  export type GetAssetBatchRequest = {
    ids: Array<string>;
    displayOptions?: GetAssetDisplayOptions;
  };

  // getAssetsByGroup //
  export type AssetsByGroupRequest = {
    groupValue: string;
    groupKey: string;
    page: number;
    limit?: number;
    before?: string;
    after?: string;
    displayOptions?: DisplayOptions;
    sortBy?: AssetSortingRequest;
  };
  export type GetAssetsBatchRequest = {
    ids: string[];
  };

  // searchAssets
  export interface SearchAssetsRequest {
    page?: number; // starts at 1
    limit?: number;
    cursor?: string;
    before?: string;
    after?: string;
    creatorAddress?: string;
    ownerAddress?: string;
    jsonUri?: string;
    grouping?: string[];
    burnt?: boolean;
    sortBy?: AssetSortingRequest;
    frozen?: boolean;
    supplyMint?: string;
    supply?: number;
    interface?: string;
    delegate?: string;
    ownerType?: OwnershipModel;
    royaltyAmount?: number;
    royaltyTarget?: string;
    royaltyTargetType?: RoyaltyModel;
    compressible?: boolean;
    compressed?: boolean;
    tokenType?: TokenType;
  }

  // getAssetsByAuthority
  export type AssetsByAuthorityRequest = {
    authorityAddress: string;
    page: number;
    limit?: number;
    before?: string;
    after?: string;
    displayOptions?: DisplayOptions;
    sortBy?: AssetSortingRequest;
  };
  // getAsset
  export type GetAssetRequest = {
    id: string;
    displayOptions?: GetAssetDisplayOptions;
  };
  // getRwaAsset
  export type GetRwaAssetRequest = {
    id: string;
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
  };
  // RWA Asset Response
  export type GetRwaAssetResponse = {
    items: FullRwaAccount;
  };
  export type GetAssetResponseList = {
    grand_total?: number;
    total: number;
    limit: number;
    page?: number;
    cursor?: string;
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
  // DisplayOptions

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

  // Display options for getAssetBatch do not include grand_total.
  export type GetAssetDisplayOptions = {
    showUnverifiedCollections?: boolean;
    showCollectionMetadata?: boolean;
    showRawData?: boolean;
    showFungible?: boolean;
    requireFullIndex?: boolean;
    showSystemMetadata?: boolean;
    showNativeBalance?: boolean;
    showInscription?: boolean;
  };

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
  // Authorities --
  export interface Authorities {
    address: string;
    scopes: Array<Scope>;
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
    cdn_uri?: string;
    quality?: FileQuality;
    contexts?: Context[];
    [Symbol.iterator](): Iterator<File>;
  }
  // FILES --
  export type Files = File[];
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
    token_standard?: TokenType;
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

  // Get NFT Editions
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
  }

  // Get Token Accounts
  export interface TokenAccounts {
    address?: string;
    mint?: string;
    owner?: string;
    amount?: number;
    delegated_amount?: number;
    frozen?: boolean;
    // TODO: Add proper typing for token extensions instead of using `any`
    token_extensions: any;
  }

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
  }

  export interface GetTokenAccountsResponse {
    total?: number;
    limit?: number;
    page?: number;
    cursor?: string;
    token_accounts?: TokenAccounts[];
  }

  export type TokenType =
    | 'fungible'
    | 'nonFungible'
    | 'compressedNft'
    | 'regularNft'
    | 'all'
    | (string & {});

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
  // End of DAS
}
