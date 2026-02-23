// Helper that keeps runtime values and infers the union type
const makeEnum = <T extends Record<string, string>>(o: T) => o;

/** Asset interface type — identifies the on-chain program standard. */
export const Interface = makeEnum({
  V1_NFT: "V1_NFT",
  CUSTOM: "Custom",
  V1_PRINT: "V1_PRINT",
  LEGACY_NFT: "Legacy_NFT",
  V2_NFT: "V2_NFT",
  FUNGIBLE_ASSET: "FungibleAsset",
  IDENTITY: "Identity",
  EXECUTABLE: "Executable",
  PROGRAMMABLE_NFT: "ProgrammableNFT",
  FUNGIBLE_TOKEN: "FungibleToken",
  MPL_CORE_ASSET: "MplCoreAsset",
});

/** Asset interface type — identifies the on-chain program standard. */
export type Interface = (typeof Interface)[keyof typeof Interface];

/** How ownership of an asset is modeled. */
export const OwnershipModel = makeEnum({
  SINGLE: "single",
  TOKEN: "token",
});

/** How ownership of an asset is modeled. */
export type OwnershipModel =
  (typeof OwnershipModel)[keyof typeof OwnershipModel];

/** Royalty distribution model for an asset. */
export const RoyaltyModel = makeEnum({
  CREATORS: "creators",
  FANOUT: "fanout",
  SINGLE: "single",
});

/** Royalty distribution model for an asset. */
export type RoyaltyModel = (typeof RoyaltyModel)[keyof typeof RoyaltyModel];

/** Authority scope level for an asset. */
export const Scope = makeEnum({
  FULL: "full",
  ROYALTY: "royalty",
  METADATA: "metadata",
  EXTENSION: "extension",
});

/** Authority scope level for an asset. */
export type Scope = (typeof Scope)[keyof typeof Scope];

/** Method governing how an asset's uses are consumed. */
export const UseMethods = makeEnum({
  BURN: "Burn",
  SINGLE: "Single",
  MULTIPLE: "Multiple",
});

/** Method governing how an asset's uses are consumed. */
export type UseMethods = (typeof UseMethods)[keyof typeof UseMethods];

/** Display context in which a file/asset is intended to be rendered. */
export const Context = makeEnum({
  WALLET_DEFAULT: "wallet-default",
  WEB_DESKTOP: "web-desktop",
  WEB_MOBILE: "web-mobile",
  APP_MOBILE: "app-mobile",
  APP_DESKTOP: "app-desktop",
  APP: "app",
  VR: "vr",
});

/** Display context in which a file/asset is intended to be rendered. */
export type Context = (typeof Context)[keyof typeof Context];

/** Field by which DAS asset queries can be sorted. */
export const AssetSortBy = makeEnum({
  ID: "id",
  CREATED: "created",
  UPDATED: "updated",
  RECENT_ACTION: "recent_action",
  NONE: "none",
});

/** Field by which DAS asset queries can be sorted. */
export type AssetSortBy = (typeof AssetSortBy)[keyof typeof AssetSortBy];

/** Sort direction for DAS asset queries. */
export const AssetSortDirection = makeEnum({ ASC: "asc", DESC: "desc" });
/** Sort direction for DAS asset queries. */
export type AssetSortDirection =
  (typeof AssetSortDirection)[keyof typeof AssetSortDirection];

/** Token standard classification. */
export const TokenStandard = makeEnum({
  PROGRAMMABLE_NON_FUNGIBLE: "ProgrammableNonFungible",
  NON_FUNGIBLE: "NonFungible",
  FUNGIBLE: "Fungible",
  FUNGIBLE_ASSET: "FungibleAsset",
  NON_FUNGIBLE_EDITION: "NonFungibleEdition",
  UNKNOWN_STANDARD: "UnknownStandard",
});

/** Token standard classification. */
export type TokenStandard = (typeof TokenStandard)[keyof typeof TokenStandard];

/** Priority fee level hint for the `getPriorityFeeEstimate` API. */
export const PriorityLevel = makeEnum({
  MIN: "Min",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERY_HIGH: "VeryHigh",
  UNSAFE_MAX: "UnsafeMax",
  DEFAULT: "Default",
});

/** Priority fee level hint for the `getPriorityFeeEstimate` API. */
export type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];

/** Transaction encoding format for UI / RPC requests. */
export const UiTransactionEncoding = makeEnum({
  Binary: "binary",
  Base64: "base64",
  Base58: "base58",
  Json: "json",
  JsonParsed: "jsonParsed",
});

/** Transaction encoding format for UI / RPC requests. */
export type UiTransactionEncoding =
  (typeof UiTransactionEncoding)[keyof typeof UiTransactionEncoding];
