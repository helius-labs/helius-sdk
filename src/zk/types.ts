export interface GetCompressedAccountRequest {
  address: string | null;
  hash?: string;
}

export interface GetCompressedAccountValue {
  address: string;
  data: {
    data: string;
    dataHash: string;
    discriminator: number;
  };
  hash: string;
  lamports: number;
  leafIndex: number;
  owner: string;
  seq: number;
  slotCreated: number;
  tree: string;
}

export interface GetCompressedAccountResponse {
  value: GetCompressedAccountValue;
  context: { slot: number };
}

export type GetCompressedAccountProofRequest = Readonly<{
  hash: string;
}>;

export type MerkleProofWithContext = Readonly<{
  hash: string;
  leafIndex: number;
  merkleTree: string;
  proof: string[];
  root: string;
  rootSeq: bigint | number;
}>;

export type GetCompressedAccountProofResponse = Readonly<{
  context: { slot: number };
  value: MerkleProofWithContext;
}>;

export interface GetCompressedAccountsByOwnerRequest {
  owner: string;
  cursor?: string | null;
  limit?: number | null;
  dataSlice?: { offset: number; length: number } | null;
  filters?: ReadonlyArray<{ memcmp: { offset: number; bytes: string } }>;
}

export interface AccountData {
  discriminator: number;
  data: string; // Base64
  dataHash: string;
}

export interface CompressedAccount {
  address?: string;
  data?: AccountData;
  hash: string;
  lamports: number;
  leafIndex: number;
  owner: string;
  seq: number;
  slotCreated: number;
  tree: string;
}

export interface PaginatedAccountList {
  cursor?: string;
  items: CompressedAccount[];
}

export interface GetCompressedAccountsByOwnerResponse {
  context: { slot: number };
  value: PaginatedAccountList;
}

export interface GetCompressedBalanceRequest {
  address?: string | null;
  hash?: string | null;
}

export interface GetCompressedBalanceResponse {
  context: { slot: number };
  value: number;
}

export type GetCompressedBalanceFn = (
  p: GetCompressedBalanceRequest
) => Promise<GetCompressedBalanceResponse>;

export interface GetCompressedBalanceByOwnerRequest {
  owner: string;
}

export interface GetCompressedBalanceByOwnerResponse {
  context: { slot: number };
  value: number;
}

export type GetCompressedBalanceByOwnerFn = (
  p: GetCompressedBalanceByOwnerRequest
) => Promise<GetCompressedBalanceByOwnerResponse>;

export interface GetCompressedMintTokenHoldersRequest {
  mint: string; // Base58
  cursor?: string | null; // Base58
  limit?: number | null;
}

export interface OwnerBalance {
  owner: string;
  balance: number;
}

export interface GetCompressedMintTokenHoldersResponse {
  context: { slot: number };
  value: {
    cursor?: string;
    items: OwnerBalance[];
  };
}

export type GetCompressedMintTokenHoldersFn = (
  p: GetCompressedMintTokenHoldersRequest
) => Promise<GetCompressedMintTokenHoldersResponse>;

export interface GetCompressedTokenAccountBalanceRequest {
  address?: string | null;
  hash?: string | null;
}

export interface GetCompressedTokenAccountBalanceResponse {
  context: { slot: number };
  value: {
    amount: number;
  };
}

export type GetCompressedTokenAccountBalanceFn = (
  p: GetCompressedTokenAccountBalanceRequest
) => Promise<GetCompressedTokenAccountBalanceResponse>;

export interface GetCompressedTokenAccountsByDelegateRequest {
  delegate: string;
  // Can narrow down to a specific mint
  mint?: string | null;
  cursor?: string | null;
  limit?: number | null;
}

export interface GetCompressedTokenAccountsByDelegateResponse {
  context: { slot: number };
  value: {
    cursor?: string;
    items: Array<{
      account: CompressedAccount;
      tokenData: {
        amount: number;
        delegate?: string;
        mint: string;
        owner: string;
        state: "initialized" | "frozen";
        tlv?: string;
      };
    }>;
  };
}

export type GetCompressedTokenAccountsByDelegateFn = (
  p: GetCompressedTokenAccountsByDelegateRequest
) => Promise<GetCompressedTokenAccountsByDelegateResponse>;

export interface GetCompressedTokenAccountsByOwnerRequest {
  owner: string;
  mint?: string | null;
  cursor?: string | null;
  limit?: number | null;
}

export interface GetCompressedTokenAccountsByOwnerResponse {
  context: { slot: number };
  value: {
    cursor?: string;
    items: Array<{
      account: CompressedAccount;
      tokenData: {
        amount: number;
        delegate?: string;
        mint: string;
        owner: string;
        state: "initialized" | "frozen";
        tlv?: string;
      };
    }>;
  };
}

export type GetCompressedTokenAccountsByOwnerFn = (
  p: GetCompressedTokenAccountsByOwnerRequest
) => Promise<GetCompressedTokenAccountsByOwnerResponse>;

export interface GetCompressedTokenBalancesByOwnerRequest {
  owner: string;
  mint?: string | null;
  cursor?: string | null;
  limit?: number | null;
}

export interface TokenBalance {
  mint: string;
  balance: number;
}

export interface GetCompressedTokenBalancesByOwnerResponse {
  context: { slot: number };
  value: {
    cursor?: string;
    token_balances: TokenBalance[];
  };
}

export type GetCompressedTokenBalancesByOwnerFn = (
  p: GetCompressedTokenBalancesByOwnerRequest
) => Promise<GetCompressedTokenBalancesByOwnerResponse>;

export interface GetCompressedTokenBalancesByOwnerV2Response {
  context: { slot: number };
  value: {
    cursor?: string;
    // In V2 the array is called `items` instead of `token_balances`
    items: TokenBalance[];
  };
}

export type GetCompressedTokenBalancesByOwnerV2Fn = (
  p: GetCompressedTokenBalancesByOwnerRequest
) => Promise<GetCompressedTokenBalancesByOwnerV2Response>;

export interface GetCompressionSignaturesForAccountRequest {
  // Merkle-tree hash of the compressed account
  hash: string;
}

export interface SignatureInfo {
  signature: string; // Base58
  slot: number;
  blockTime: number; // Unix
}

export interface GetCompressionSignaturesForAccountResponse {
  context: { slot: number };
  value: { items: SignatureInfo[] };
}

export type GetCompressionSignaturesForAccountFn = (
  p: GetCompressionSignaturesForAccountRequest
) => Promise<GetCompressionSignaturesForAccountResponse>;

export interface GetCompressionSignaturesForAddressRequest {
  address: string;
  cursor?: string | null;
  limit?: number | null;
}

export interface PaginatedSignatureInfoList {
  cursor?: string | null;
  items: SignatureInfo[];
}

export interface GetCompressionSignaturesForAddressResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

export type GetCompressionSignaturesForAddressFn = (
  p: GetCompressionSignaturesForAddressRequest
) => Promise<GetCompressionSignaturesForAddressResponse>;

export interface GetCompressionSignaturesForOwnerRequest {
  owner: string;
  cursor?: string | null;
  limit?: number | null;
}

export interface GetCompressionSignaturesForOwnerResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

export type GetCompressionSignaturesForOwnerFn = (
  p: GetCompressionSignaturesForOwnerRequest
) => Promise<GetCompressionSignaturesForOwnerResponse>;

export interface GetCompressionSignaturesForTokenOwnerRequest {
  owner: string;
  cursor?: string | null;
  limit?: number | null;
}

export interface GetCompressionSignaturesForTokenOwnerResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;      
}

export type GetCompressionSignaturesForTokenOwnerFn = (
  p: GetCompressionSignaturesForTokenOwnerRequest,
) => Promise<GetCompressionSignaturesForTokenOwnerResponse>;

export type GetIndexerHealthRequest = Record<string, never>;

export type GetIndexerHealthResponse = "ok";

export type GetIndexerHealthFn = () => Promise<GetIndexerHealthResponse>;

export type GetIndexerSlotRequest = Record<string, never>;

export type GetIndexerSlotResponse = number;

export type GetIndexerSlotFn = () => Promise<GetIndexerSlotResponse>;