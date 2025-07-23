// Helper that keeps runtime values and infers the union type
const makeEnum = <T extends Record<string, string>>(o: T) => o;

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

export type Interface = (typeof Interface)[keyof typeof Interface];

export const OwnershipModel = makeEnum({
  SINGLE: "single",
  TOKEN: "token",
});

export type OwnershipModel =
  (typeof OwnershipModel)[keyof typeof OwnershipModel];

export const RoyaltyModel = makeEnum({
  CREATORS: "creators",
  FANOUT: "fanout",
  SINGLE: "single",
});

export type RoyaltyModel = (typeof RoyaltyModel)[keyof typeof RoyaltyModel];

export const Scope = makeEnum({
  FULL: "full",
  ROYALTY: "royalty",
  METADATA: "metadata",
  EXTENSION: "extension",
});

export type Scope = (typeof Scope)[keyof typeof Scope];

export const UseMethods = makeEnum({
  BURN: "Burn",
  SINGLE: "Single",
  MULTIPLE: "Multiple",
});

export type UseMethods = (typeof UseMethods)[keyof typeof UseMethods];

export const Context = makeEnum({
  WALLET_DEFAULT: "wallet-default",
  WEB_DESKTOP: "web-desktop",
  WEB_MOBILE: "web-mobile",
  APP_MOBILE: "app-mobile",
  APP_DESKTOP: "app-desktop",
  APP: "app",
  VR: "vr",
});

export type Context = (typeof Context)[keyof typeof Context];

export const AssetSortBy = makeEnum({
  ID: "id",
  CREATED: "created",
  UPDATED: "updated",
  RECENT_ACTION: "recent_action",
});

export type AssetSortBy = (typeof AssetSortBy)[keyof typeof AssetSortBy];

export const AssetSortDirection = makeEnum({ ASC: "asc", DESC: "desc" });
export type AssetSortDirection =
  (typeof AssetSortDirection)[keyof typeof AssetSortDirection];

export const TokenStandard = makeEnum({
  PROGRAMMABLE_NON_FUNGIBLE: "ProgrammableNonFungible",
  NON_FUNGIBLE: "NonFungible",
  FUNGIBLE: "Fungible",
  FUNGIBLE_ASSET: "FungibleAsset",
  NON_FUNGIBLE_EDITION: "NonFungibleEdition",
  UNKNOWN_STANDARD: "UnknownStandard",
});

export type TokenStandard = (typeof TokenStandard)[keyof typeof TokenStandard];

export const PriorityLevel = makeEnum({
  MIN: "Min",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERY_HIGH: "VeryHigh",
  UNSAFE_MAX: "UnsafeMax",
  DEFAULT: "Default",
});

export type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];

export const UiTransactionEncoding = makeEnum({
  Binary: "binary",
  Base64: "base64",
  Base58: "base58",
  Json: "json",
  JsonParsed: "jsonParsed",
});

export type UiTransactionEncoding = (typeof UiTransactionEncoding)[keyof typeof UiTransactionEncoding];