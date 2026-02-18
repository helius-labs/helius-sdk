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

/** Token type filter for DAS queries. */
export type TokenType =
  | "fungible"
  | "nonFungible"
  | "compressedNft"
  | "regularNft"
  | "all"
  | (string & {});

/** A Solana digital asset returned by the DAS API. */
export interface Asset {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** The interface type of the asset, indicating its token standard and implementation (e.g. `V1_NFT`, `FungibleToken`). */
  interface: Interface;
  /** The asset's mint address. */
  id: string;
  /** Content information including metadata, files, and links. */
  content?: Content;
  /** Authorities and their scopes for this asset. */
  authorities?: Authorities[];
  /** Compression details of the asset, indicating if it's a compressed NFT (cNFT) using Solana state compression. */
  compression?: Compression;
  /** Collection or other group memberships. */
  grouping?: Grouping[];
  /** Royalty information used for marketplace fee calculations and creator payments. */
  royalty?: Royalty;
  /** Ownership details including current owner, delegation status, and freezing information. */
  ownership: Ownership;
  /** Verified and unverified creators with share percentages. */
  creators?: Creators[];
  /** Use / consumption restrictions. */
  uses?: Uses;
  /** Print supply information for master editions. */
  supply?: Supply;
  /** Whether the asset's metadata is mutable. */
  mutable: boolean;
  /** Whether the asset has been burnt. */
  burnt: boolean;
  /** Token-2022 mint extension data, if any. */
  mint_extensions?: MintExtensions;
  /** SPL token metadata (symbol, balance, price). */
  token_info?: TokenInfo;
  /** On-chain inscription data. Present when `showInscription: true` is passed. */
  inscription?: Inscription;
  /** SPL-20 token data associated with this asset's inscription. */
  spl20?: Record<string, unknown>;
}

/** On-chain inscription data attached to an asset. */
export interface Inscription {
  /** Ordinal order of the inscription. */
  order?: number;
  /** Size of the inscription in bytes. */
  size?: number;
  /** MIME type of the inscribed content (e.g. `"text/plain"`). */
  contentType?: string;
  /** Encoding used for the inscribed data. */
  encoding?: string;
  /** Hash used to validate inscription integrity. */
  validationHash?: string;
  /** On-chain account storing the raw inscription data. */
  inscriptionDataAccount?: string;
  /** Authority over the inscription. */
  authority?: string;
}

/** Ownership state of an asset. */
export interface Ownership {
  /** Whether the token account is frozen. */
  frozen: boolean;
  /** Whether the asset has been delegated. */
  delegated: boolean;
  /** Delegate address, if delegated. */
  delegate?: string;
  /** Ownership model (`single` or `token`). */
  ownership_model: OwnershipModel;
  /** Current owner wallet address. */
  owner: string;
}

/** Print supply information for NFT master editions. */
export interface Supply {
  /** Maximum number of prints allowed (0 = unlimited). */
  print_max_supply: number;
  /** Number of prints currently minted. */
  print_current_supply: number;
  /** Edition nonce used for PDA derivation. */
  edition_nonce?: number;
}

/** Use / consumption restrictions on an asset. */
export interface Uses {
  /** Method governing consumption (`Burn`, `Single`, `Multiple`). */
  use_method: UseMethods;
  /** Number of uses remaining. */
  remaining: number;
  /** Total uses originally allowed. */
  total: number;
}

/** A creator entry on an asset. */
export interface Creators {
  /** Creator's wallet address. */
  address: string;
  /** Royalty share percentage (0–100). */
  share: number;
  /** Whether the creator has signed/verified the asset. */
  verified: boolean;
}

/** Royalty configuration for an asset. */
export interface Royalty {
  /** Distribution model (`creators`, `fanout`, or `single`). */
  royalty_model: RoyaltyModel;
  /** Target address for single-recipient royalties. */
  target?: string;
  /** Royalty percentage as a decimal (e.g. 0.05 = 5%). */
  percent: number;
  /** Royalty in basis points (e.g. 500 = 5%). */
  basis_points: number;
  /** Whether the primary sale has occurred. */
  primary_sale_happened: boolean;
  /** Whether the royalty configuration is locked. */
  locked: boolean;
}

/** A group (e.g. collection) that an asset belongs to. */
export interface Grouping {
  /** Group type key (e.g. `"collection"`). */
  group_key: string;
  /** Group identifier value (e.g. collection mint address). */
  group_value: string;
  /** Whether the grouping has been verified on-chain. */
  verified?: boolean;
  /** Optional collection-level metadata. */
  collection_metadata?: CollectionMetadata;
}

/** Metadata for a collection group. */
export interface CollectionMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  external_url?: string;
}

/** An authority and its scope on an asset. */
export interface Authorities {
  /** Authority wallet address. */
  address: string;
  /** Scopes this authority controls (e.g. `full`, `metadata`). */
  scopes: Scope[];
}

/** Off-chain content associated with an asset. */
export interface Content {
  /** JSON schema identifier for the metadata format. */
  $schema: string;
  /** URI pointing to the JSON metadata for the asset, typically hosted on Arweave or other decentralized storage. */
  json_uri: string;
  /** Associated media files. */
  files?: File[];
  /** Parsed metadata (name, symbol, description, attributes). */
  metadata: Metadata;
  /** External links (website, image, animation). */
  links?: Links;
}

/** External links associated with an asset's content. */
export type Links = {
  external_url?: string;
  image?: string;
  animation_url?: string;
};

/** A media file associated with an asset. */
export interface File {
  /** Original file URI. */
  uri?: string;
  /** MIME type (e.g. `"image/png"`). */
  mime?: string;
  /** CDN-cached URI for faster access. */
  cdn_uri?: string;
  /** Quality/schema information for the file. */
  quality?: FileQuality;
  /** Display contexts where this file is appropriate. */
  contexts?: Context[];
}

/** Quality schema descriptor for a media file. */
export interface FileQuality {
  schema: string;
}

/** Standard metadata fields for an asset. */
export interface Metadata {
  /** Key-value trait attributes. */
  attributes?: Attribute[];
  /** Human-readable description. */
  description: string;
  /** Display name. */
  name: string;
  /** Ticker symbol. */
  symbol: string;
  /** Token standard classification. */
  token_standard?: TokenType;
}

/** A single trait attribute (key-value pair) on an asset. */
export interface Attribute {
  /** The attribute value. */
  value: string;
  /** The trait type / category name. */
  trait_type: string;
}

/** Compression details for a compressed NFT (cNFT). */
export interface Compression {
  /** Whether this asset is eligible for compression. */
  eligible: boolean;
  /** Whether this asset is currently compressed using Solana's state compression technology, which reduces storage costs. */
  compressed: boolean;
  /** Hash of the asset's data. */
  data_hash: string;
  /** Hash of the creator array. */
  creator_hash: string;
  /** Combined asset hash. */
  asset_hash: string;
  /** Merkle tree address holding this leaf. */
  tree: string;
  /** Sequence number of the last update. */
  seq: number;
  /** Leaf index within the Merkle tree. */
  leaf_id: number;
}

/** Token-2022 mint extension data on an asset. */
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

/** Confidential transfer mint extension configuration. */
export interface ConfidentialTransferMint {
  authority: string;
  auto_approve_new_accounts: boolean;
  auditor_elgamal_pubkey: string;
}

/** Confidential transfer fee configuration extension. */
export interface ConfidentialTransferFeeConfig {
  authority: string;
  withdraw_withheld_authority_elgamal_pubkey: string;
  harvest_to_mint_enabled: boolean;
  withheld_amount: string;
}

/** Transfer fee configuration extension. */
export interface TransferFeeConfig {
  transfer_fee_config_authority: string;
  withdraw_withheld_authority: string;
  withheld_amount: number;
  older_transfer_fee: OlderTransferFee;
  newer_transfer_fee: NewTransferFee;
}

/** Historical transfer fee schedule. */
export interface OlderTransferFee {
  epoch: string;
  maximum_fee: string;
  transfer_fee_basis_points: string;
}

/** Upcoming transfer fee schedule. */
export interface NewTransferFee {
  epoch: string;
}

/** Metadata pointer extension — links a mint to its on-chain metadata account. */
export interface MetadataPointer {
  authority: string;
  metadata_address: string;
}

/** Mint close authority extension. */
export interface MintCloseAuthority {
  close_authority: string;
}

/** Permanent delegate extension. */
export interface PermanentDelegate {
  delegate: string;
}

/** Transfer hook extension — runs a CPI on every transfer. */
export interface TransferHook {
  authority: string;
  programId: string;
}

/** Interest-bearing token extension configuration. */
export interface InterestBearingConfig {
  rate_authority: string;
  initialization_timestamp: number;
  pre_update_average_rate: number;
  last_update_timestamp: number;
  current_rate: number;
}

/** Default account state extension for new token accounts. */
export interface DefaultAccountState {
  state: string;
}

/** Confidential transfer account extension state. */
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

/** On-chain metadata stored via the Token-2022 metadata extension. */
export interface MintExtensionMetadata {
  updateAuthority: string;
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  additionalMetadata: AdditionalMetadata;
}

/** A single additional metadata key-value pair. */
export interface AdditionalMetadata {
  key: string;
  value: string;
}

/** SPL token information attached to an asset. */
export interface TokenInfo {
  /** Token ticker symbol. */
  symbol?: string;
  /** Token balance in the smallest unit. */
  balance?: number;
  /** Total supply of the token. */
  supply?: number;
  /** Number of decimal places. */
  decimals?: number;
  /** Token program address (e.g. SPL Token or Token-2022). */
  token_program?: string;
  /** Associated token account address. */
  associated_token_address?: string;
  /** USD price information from Jupiter. */
  price_info?: PriceInfo;
  /** Mint authority address. */
  mint_authority?: string;
  /** Freeze authority address. */
  freeze_authority?: string;
}

/** USD price information for a token. */
export interface PriceInfo {
  /** Price per single token in USD. */
  price_per_token: number;
  /** Currency code (e.g. `"USDC"`). */
  currency: string;
  /** Total value of the holding in USD. */
  total_price?: number;
}

// ── DAS Request / Response Types ────────────────────────────────────

/** Request parameters for `getAssetsByAuthority`. */
export type GetAssetsByAuthorityRequest = {
  /** The authority address whose assets to retrieve. */
  authorityAddress: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of assets to return (max 1000). */
  limit?: number;
  /** The cursor for paginating backwards through the assets. */
  before?: string;
  /** The cursor for paginating forwards through the assets. */
  after?: string;
  /** Display options controlling what extra data is returned. */
  options?: DisplayOptions;
  /** The sorting options for the response. */
  sortBy?: AssetSortingRequest;
};

/** Flags that control what extra data is returned in asset list responses. */
export type DisplayOptions = {
  /** Displays grouping information for unverified collections instead of skipping them. Defaults to `false`. */
  showUnverifiedCollections?: boolean;
  /** Displays metadata for the collection. Defaults to `false`. */
  showCollectionMetadata?: boolean;
  /** Shows the total number of assets that matched the query. This will make the request slower. Defaults to `false`. */
  showGrandTotal?: boolean;
  /** Displays inscription details of assets inscribed on-chain. Defaults to `false`. */
  showInscription?: boolean;
  /** Include raw on-chain account data. */
  showRawData?: boolean;
  /** Include fungible tokens in the response. */
  showFungible?: boolean;
  /** Require a full index scan (slower, but complete). */
  requireFullIndex?: boolean;
  /** Include system-level metadata fields. */
  showSystemMetadata?: boolean;
  /** Include token accounts with zero balance. */
  showZeroBalance?: boolean;
  /** Include closed token accounts. */
  showClosedAccounts?: boolean;
  /** Include native SOL balance alongside token assets. */
  showNativeBalance?: boolean;
};

/** Sort field and direction for DAS asset list requests. */
export type AssetSortingRequest = {
  sortBy: AssetSortBy;
  sortDirection: AssetSortDirection;
};

/** Paginated list of assets returned by DAS list endpoints. */
export type GetAssetResponseList = {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** Total count across all pages (only present if `showGrandTotal` is set). */
  grand_total?: number;
  /** The total number of assets found. */
  total: number;
  /** The maximum number of assets requested. */
  limit: number;
  /** The current page of results. */
  page?: number;
  /** Cursor for the next page. */
  cursor?: string;
  /** The assets in this page. */
  items: GetAssetResponse[];
  /** Native SOL balance info (only if `showNativeBalance` is set). */
  nativeBalance?: NativeBalanceInfo;
};

/** Native SOL balance and price information. */
export type NativeBalanceInfo = {
  /** Balance in lamports. */
  lamports: number;
  /** Current SOL price in USD. */
  price_per_sol: number;
  /** Total USD value of the SOL balance. */
  total_price: number;
};

/** Request parameters for `getAssetsByCreator`. */
export type AssetsByCreatorRequest = {
  /** The Solana wallet address of the creator to retrieve all digital assets for. */
  creatorAddress: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** Only return assets where the creator is verified. */
  onlyVerified?: boolean;
  /** The maximum number of assets to return (max 1000). */
  limit?: number;
  /** The cursor for paginating backwards through the assets. */
  before?: string;
  /** The cursor for paginating forwards through the assets. */
  after?: string;
  /** Display options controlling what extra data is returned. */
  options?: DisplayOptions;
  /** The sorting options for the response. */
  sortBy?: AssetSortingRequest;
};

/** Request parameters for `getAssetsByGroup`. */
export type AssetsByGroupRequest = {
  /** The group classification type to search by (e.g. `"collection"`, `"community"`, `"creator"`). */
  groupKey: string;
  /** The collection address or group identifier to retrieve all matching assets for. */
  groupValue: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of assets to return (max 1000). */
  limit?: number;
  /** The cursor for paginating backwards through the assets. */
  before?: string;
  /** The cursor for paginating forwards through the assets. */
  after?: string;
  /** Display options controlling what extra data is returned. */
  options?: DisplayOptions;
  /** The sorting options for the response. */
  sortBy?: AssetSortingRequest;
};

/** Request parameters for `getAssetsByOwner`. */
export type AssetsByOwnerRequest = {
  /** The Solana wallet address to retrieve all owned digital assets for. */
  ownerAddress: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of assets to return per page (max 1000). */
  limit?: number;
  /** The cursor for paginating backwards through the assets. */
  before?: string;
  /** The cursor for paginating forwards through the assets. */
  after?: string;
  /** Display options controlling what extra data is returned. */
  displayOptions?: DisplayOptions;
  /** The sorting options for the response. */
  sortBy?: AssetSortingRequest;
};

/** A single print edition of an NFT master edition. */
export interface Editions {
  /** The unique mint address of this individual edition. */
  mint?: string;
  /** The on-chain address of this edition account. */
  edition_address?: string;
  /** The sequential edition number in the print series. */
  edition?: number;
  /** Whether this edition has been burnt. */
  burnt?: boolean;
}

/** Request parameters for `getNftEditions`. */
export interface GetNftEditionsRequest {
  /** The mint address of the master edition NFT to retrieve all print editions for. */
  mint: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of editions to return in a single request. */
  limit?: number;
}

/** Response from `getNftEditions`. */
export interface GetNftEditionsResponse {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** The total number of print editions minted from this master. */
  total?: number;
  /** The maximum number of editions requested. */
  limit?: number;
  /** The current page of results. */
  page?: number;
  /** The on-chain address of the master edition account. */
  master_edition_address?: string;
  /** Current number of print editions minted from this master. */
  supply?: number;
  /** Maximum number of print editions that can be minted from this master (0 = unlimited). */
  max_supply?: number;
  /** The individual print editions minted from this master. */
  editions?: Editions[];
}

/**
 * Request parameters for `getSignaturesForAsset`.
 *
 * @remarks This method is specifically designed for compressed NFTs (cNFTs).
 * For regular NFTs, use `getSignaturesForAddress` instead — the standard method
 * does not work with compressed NFTs.
 */
export interface GetSignaturesForAssetRequest {
  /** The unique identifier (mint address) of the compressed NFT to retrieve transaction history for. */
  id: string;
  /** The page of results to return (1-indexed). */
  page: number;
  /** The maximum number of transaction signatures to return per request. */
  limit?: number;
  /** The cursor for paginating backwards through the signatures. */
  before?: string;
  /** The cursor for paginating forwards through the signatures. */
  after?: string;
}

/** Response from `getSignaturesForAsset`. */
export interface GetSignaturesForAssetResponse {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** The total number of transactions found in this asset's history. */
  total: number;
  /** The maximum number of transaction signatures requested per page. */
  limit: number;
  /** The current page of results. */
  page?: number;
  before?: string;
  after?: string;
  /** Array of `[signature, operationType]` tuples representing each transaction that affected this asset. */
  items: Array<Array<string>>;
}

/** A token account entry returned by `getTokenAccounts`. */
export interface TokenAccounts {
  /** The address of the token account. */
  address?: string;
  /** The address of the mint account. */
  mint?: string;
  /** The address of the token account owner. */
  owner?: string;
  /** Number of tokens in the account. */
  amount?: number;
  /** Number of delegated tokens in the account. */
  delegated_amount?: number;
  /** Whether the token account is frozen. */
  frozen?: boolean;
  /** Whether the token account has been burnt. */
  burnt?: boolean;
  // TODO: Add proper typing for token extensions instead of using `any`
  token_extensions: any;
}

/** Request parameters for `getTokenAccounts`. */
export interface GetTokenAccountsRequest {
  /** Filter by token mint address. */
  mint?: string;
  /** Filter by owner wallet address. */
  owner?: string;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of token accounts to return. */
  limit?: number;
  /** The cursor used for pagination. */
  cursor?: string;
  /** Returns results before the specified cursor. */
  before?: string;
  /** Returns results after the specified cursor. */
  after?: string;
  options?: {
    /** If `true`, include token accounts with zero balance. */
    showZeroBalance?: boolean;
  };
}

/** Response from `getTokenAccounts`. */
export interface GetTokenAccountsResponse {
  /** All on-chain data up to and including this slot is guaranteed to have been indexed. */
  last_indexed_slot?: number;
  /** The number of results found for the request. */
  total?: number;
  /** The maximum number of results requested. */
  limit?: number;
  /** The current page of results. */
  page?: number;
  /** The cursor used for pagination. */
  cursor?: string;
  /** An array of matching token accounts. */
  token_accounts?: TokenAccounts[];
}

/** Request parameters for `searchAssets`. Supports flexible multi-field filtering. */
export interface SearchAssetsRequest {
  /** The Solana wallet address to retrieve owned digital assets for. */
  ownerAddress?: string;
  /**
   * Filter for specific token types.
   * - `fungible` — SPL fungible tokens
   * - `nonFungible` — all non-fungible tokens
   * - `regularNft` — standard (non-compressed) NFTs
   * - `compressedNft` — compressed NFTs (cNFTs)
   * - `all` — all token types
   */
  tokenType?: TokenType;
  /** The page of results to return (1-indexed). */
  page?: number;
  /** The maximum number of assets to return (max 1000). */
  limit?: number;
  /** Pagination cursor. */
  cursor?: string;
  /** A cursor for paginating backward. */
  before?: string;
  /** A cursor for paginating forward. */
  after?: string;
  /** The sorting options for the response. */
  sortBy?: AssetSortingRequest;
  /** Display options controlling what extra data is returned. */
  options?: DisplayOptions;
  /** Filter by creator wallet address. */
  creatorAddress?: string;
  /** Whether the creator must be verified. */
  creatorVerified?: boolean;
  /** Filter by authority address (e.g. update authority). */
  authorityAddress?: string;
  /** Filter by owner wallet address. */
  ownerType?: OwnershipModel;
  /** Filter by group membership (e.g. `["collection", "<address>"]`). */
  grouping?: string[];
  /**
   * Filter by Merkle tree address for compressed NFTs (cNFTs).
   * @remarks Helius-specific extension, not part of the official DAS specification.
   */
  tree?: string;
  /** Filter by off-chain JSON metadata URI. */
  jsonUri?: string;
  /** Filter for compressed assets using Solana state compression technology. */
  compressed?: boolean;
  /** Filter for assets eligible for compression but not yet compressed. */
  compressible?: boolean;
  /** Filter by delegate address. */
  delegate?: string;
  /** Filter by supply amount. */
  supply?: number;
  /** Filter by supply mint address. */
  supplyMint?: string;
  /** Whether to return only frozen assets. */
  frozen?: boolean;
  /** Whether to return only burnt assets. */
  burnt?: boolean;
  /** Filter by asset interface type (e.g. `"V1_NFT"`, `"ProgrammableNFT"`). */
  interface?: string;
  /** Filter by royalty target type. */
  royaltyTargetType?: RoyaltyModel;
  /** Filter by royalty target address. */
  royaltyTarget?: string;
  /** Filter by royalty amount in basis points. */
  royaltyAmount?: number;
}
