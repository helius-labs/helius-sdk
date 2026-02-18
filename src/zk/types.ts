// ── ZK Compression Types ────────────────────────────────────────────
// Types for the Light Protocol ZK compression RPC methods.

/** Request parameters for `getCompressedAccount`. */
export interface GetCompressedAccountRequest {
  /** The Solana public key of the compressed account to retrieve, or `null` to query by hash instead. */
  address: string | null;
  /** The data hash identifier of the compressed account. Used when the address is not available. */
  hash?: string;
}

/** A compressed account's on-chain data. */
export interface GetCompressedAccountValue {
  /** Unique identifier address for the compressed account. */
  address: string;
  /** On-chain data stored in the compressed account. */
  data: {
    /** Base64-encoded raw data stored in this compressed account. */
    data: string;
    /** Hash of the account data for verification. */
    dataHash: string;
    /** Discriminator used to identify the account type. */
    discriminator: number;
  };
  /** Cryptographic hash of the compressed account data for verification. */
  hash: string;
  /** SOL balance held by this compressed account in lamports (1 SOL = 1,000,000,000 lamports). */
  lamports: number;
  /** Position index in the Merkle tree where this compressed account is stored. */
  leafIndex: number;
  /** Solana program that owns this compressed account (typically the compression program). */
  owner: string;
  /** Sequence number for tracking updates to this compressed account. */
  seq: number;
  /** Solana blockchain slot when this compressed account was created. */
  slotCreated: number;
  /** Address of the Merkle tree where this compressed account is stored. */
  tree: string;
}

/** Response from `getCompressedAccount`. */
export interface GetCompressedAccountResponse {
  /** The compressed account data, or `null` if not found. */
  value: GetCompressedAccountValue;
  /** The slot context for this response. */
  context: { slot: number };
}

/** Request parameters for `getCompressedAccountProof`. */
export type GetCompressedAccountProofRequest = Readonly<{
  /** Merkle tree hash of the account. */
  hash: string;
}>;

/** A Merkle proof with tree context. */
export type MerkleProofWithContext = Readonly<{
  /** Base58-encoded hash of the compressed account's leaf node. */
  hash: string;
  /** Zero-based index of the leaf in the Merkle tree. */
  leafIndex: number;
  /** Base58-encoded public key of the state Merkle tree containing this account. */
  merkleTree: string;
  /** Sibling hashes (base58) along the path from the leaf to the root, ordered from leaf to root. */
  proof: string[];
  /** Base58-encoded current root hash of the Merkle tree. */
  root: string;
  /** Sequence number of the root; used to verify the proof is against the latest root. */
  rootSeq: bigint | number;
}>;

/** Response from `getCompressedAccountProof`. */
export type GetCompressedAccountProofResponse = Readonly<{
  /** Current slot context at the time the proof was fetched. */
  context: { slot: number };
  /** The Merkle proof and tree context for the requested compressed account. */
  value: MerkleProofWithContext;
}>;

/** Request parameters for `getCompressedAccountsByOwner`. */
export interface GetCompressedAccountsByOwnerRequest {
  /** Base58-encoded public key of the owner program whose accounts to retrieve. */
  owner: string;
  /** Base58-encoded pagination cursor from a previous response's `cursor` field; omit to start from the beginning. */
  cursor?: string | null;
  /** Maximum number of accounts to return per page. */
  limit?: number | null;
  /** Return only a byte slice of each account's data instead of the full payload. */
  dataSlice?: { offset: number; length: number } | null;
  /** Memory-comparison filters applied to each account's data (similar to `getProgramAccounts` memcmp filters). */
  filters?: ReadonlyArray<{ memcmp: { offset: number; bytes: string } }>;
}

/** Account data stored in a compressed account. */
export interface AccountData {
  /** 8-byte discriminator identifying the account type (Anchor-compatible). */
  discriminator: number;
  /** Base64-encoded raw account data. */
  data: string;
  /** Base58-encoded hash of the account data. */
  dataHash: string;
}

/** A compressed account entry. */
export interface CompressedAccount {
  /** Base58-encoded account address; only present for PDAs and explicitly addressed accounts. */
  address?: string;
  /** Application data stored in this account, if any. */
  data?: AccountData;
  /** Base58-encoded hash of the compressed account's leaf node in the Merkle tree. */
  hash: string;
  /** Lamport balance of the account. */
  lamports: number;
  /** Zero-based index of the leaf in the Merkle tree. */
  leafIndex: number;
  /** Base58-encoded public key of the program that owns this account. */
  owner: string;
  /** Sequence number that increments on each state change; used to order updates. */
  seq: number;
  /** Slot in which this account was created. */
  slotCreated: number;
  /** Base58-encoded public key of the state Merkle tree storing this account. */
  tree: string;
}

/** A paginated list of compressed accounts. */
export interface PaginatedAccountList {
  /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
  cursor?: string;
  /** Compressed accounts returned in this page. */
  items: CompressedAccount[];
}

/** Response from `getCompressedAccountsByOwner`. */
export interface GetCompressedAccountsByOwnerResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Paginated list of compressed accounts owned by the specified address. */
  value: PaginatedAccountList;
}

/** Request parameters for `getCompressedBalance`. */
export interface GetCompressedBalanceRequest {
  /** Base58-encoded public key of the compressed account, or `null` to query by hash instead. */
  address?: string | null;
  /** Base58-encoded 32-byte hash of the compressed account's leaf node, or `null` to query by address instead. */
  hash?: string | null;
}

/** Response from `getCompressedBalance`. Returns the lamport balance. */
export interface GetCompressedBalanceResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Lamport balance of the compressed account. */
  value: number;
}

/** Get the lamport balance of a compressed account. */
export type GetCompressedBalanceFn = (
  p: GetCompressedBalanceRequest
) => Promise<GetCompressedBalanceResponse>;

/** Request parameters for `getCompressedBalanceByOwner`. */
export interface GetCompressedBalanceByOwnerRequest {
  /** Base58-encoded public key of the owner whose total compressed lamport balance to retrieve. */
  owner: string;
}

/** Response from `getCompressedBalanceByOwner`. Returns the total lamport balance. */
export interface GetCompressedBalanceByOwnerResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Total lamport balance across all compressed accounts owned by the specified address. */
  value: number;
}

/** Get the total compressed lamport balance for an owner. */
export type GetCompressedBalanceByOwnerFn = (
  p: GetCompressedBalanceByOwnerRequest
) => Promise<GetCompressedBalanceByOwnerResponse>;

/** Request parameters for `getCompressedMintTokenHolders`. */
export interface GetCompressedMintTokenHoldersRequest {
  /** Base58-encoded public key of the compressed token mint. */
  mint: string;
  /** Base58-encoded pagination cursor from a previous response's `cursor` field; omit to start from the beginning. */
  cursor?: string | null;
  /** Maximum number of token holders to return per page. */
  limit?: number | null;
}

/** An owner's compressed token balance for a specific mint. */
export interface OwnerBalance {
  /** Base58-encoded public key of the token holder. */
  owner: string;
  /** Compressed token balance held by this owner (in raw token units). */
  balance: number;
}

/** Response from `getCompressedMintTokenHolders`. */
export interface GetCompressedMintTokenHoldersResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
    cursor?: string;
    /** List of owners and their compressed token balances. */
    items: OwnerBalance[];
  };
}

/** Get all holders of a compressed token mint. */
export type GetCompressedMintTokenHoldersFn = (
  p: GetCompressedMintTokenHoldersRequest
) => Promise<GetCompressedMintTokenHoldersResponse>;

/** Request parameters for `getCompressedTokenAccountBalance`. */
export interface GetCompressedTokenAccountBalanceRequest {
  /** Base58-encoded public key of the compressed token account, or `null` to query by hash instead. */
  address?: string | null;
  /** Base58-encoded 32-byte hash of the compressed token account's leaf node, or `null` to query by address instead. */
  hash?: string | null;
}

/** Response from `getCompressedTokenAccountBalance`. */
export interface GetCompressedTokenAccountBalanceResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Raw token balance of the compressed token account (in the token's smallest unit). */
    amount: number;
  };
}

/** Get the token balance of a single compressed token account. */
export type GetCompressedTokenAccountBalanceFn = (
  p: GetCompressedTokenAccountBalanceRequest
) => Promise<GetCompressedTokenAccountBalanceResponse>;

/** Request parameters for `getCompressedTokenAccountsByDelegate`. */
export interface GetCompressedTokenAccountsByDelegateRequest {
  /** Base58-encoded public key of the delegate authority to retrieve token accounts for. */
  delegate: string;
  /** Base58-encoded public key of the token mint to filter by; omit to return accounts for all mints. */
  mint?: string | null;
  /** Base58-encoded pagination cursor from a previous response's `cursor` field; omit to start from the beginning. */
  cursor?: string | null;
  /** Maximum number of token accounts to return per page. */
  limit?: number | null;
}

/** Response from `getCompressedTokenAccountsByDelegate`. */
export interface GetCompressedTokenAccountsByDelegateResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
    cursor?: string;
    /** List of compressed token accounts and their associated token data. */
    items: Array<{
      account: CompressedAccount;
      tokenData: {
        /** Raw token balance in the account (in the token's smallest unit). */
        amount: number;
        /** Base58-encoded public key of the delegate authority, if one is set. */
        delegate?: string;
        /** Base58-encoded public key of the token mint. */
        mint: string;
        /** Base58-encoded public key of the token account owner. */
        owner: string;
        /** Account state: `initialized` for active accounts, `frozen` for frozen accounts. */
        state: "initialized" | "frozen";
        /** Base64-encoded token extension data (TLV format); present for Token-2022 accounts with extensions. */
        tlv?: string;
      };
    }>;
  };
}

/** Get compressed token accounts by their delegate. */
export type GetCompressedTokenAccountsByDelegateFn = (
  p: GetCompressedTokenAccountsByDelegateRequest
) => Promise<GetCompressedTokenAccountsByDelegateResponse>;

/** Request parameters for `getCompressedTokenAccountsByOwner`. */
export interface GetCompressedTokenAccountsByOwnerRequest {
  /** Base58-encoded public key of the wallet that owns the compressed token accounts. */
  owner: string;
  /** Base58-encoded public key of the token mint to filter by; omit to return accounts for all mints. */
  mint?: string | null;
  /** Base58-encoded pagination cursor from a previous response's `cursor` field; omit to start from the beginning. */
  cursor?: string | null;
  /** Maximum number of token accounts to return per page. */
  limit?: number | null;
}

/** Response from `getCompressedTokenAccountsByOwner`. */
export interface GetCompressedTokenAccountsByOwnerResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
    cursor?: string;
    /** Array of compressed token accounts owned by the specified wallet. */
    items: Array<{
      account: CompressedAccount;
      tokenData: {
        /** Raw token balance in the account (in the token's smallest unit). */
        amount: number;
        /** Base58-encoded public key of the delegate authority, if one is set. */
        delegate?: string;
        /** Base58-encoded public key of the token mint. */
        mint: string;
        /** Base58-encoded public key of the token account owner. */
        owner: string;
        /** Account state: `initialized` for active accounts, `frozen` for frozen accounts. */
        state: "initialized" | "frozen";
        /** Base64-encoded token extension data (TLV format); present for Token-2022 accounts with extensions. */
        tlv?: string;
      };
    }>;
  };
}

/** Get compressed token accounts owned by an address. */
export type GetCompressedTokenAccountsByOwnerFn = (
  p: GetCompressedTokenAccountsByOwnerRequest
) => Promise<GetCompressedTokenAccountsByOwnerResponse>;

/** Request parameters for `getCompressedTokenBalancesByOwner` (V1 and V2). */
export interface GetCompressedTokenBalancesByOwnerRequest {
  /** Base58-encoded public key of the wallet to retrieve compressed token balances for. */
  owner: string;
  /** Base58-encoded public key of the token mint to filter by; omit to return balances for all mints. */
  mint?: string | null;
  /** Base58-encoded pagination cursor from a previous response's `cursor` field; omit to start from the beginning. */
  cursor?: string | null;
  /** Maximum number of token balances to return per page. */
  limit?: number | null;
}

/** A compressed token balance entry for a specific mint. */
export interface TokenBalance {
  /** Base58-encoded public key of the token mint. */
  mint: string;
  /** Total compressed token balance for this mint (in raw token units, summed across all compressed accounts). */
  balance: number;
}

/** Response from `getCompressedTokenBalancesByOwner` (V1). */
export interface GetCompressedTokenBalancesByOwnerResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
    cursor?: string;
    /** List of compressed token balances grouped by mint. */
    token_balances: TokenBalance[];
  };
}

/** Get compressed token balances by owner (V1). */
export type GetCompressedTokenBalancesByOwnerFn = (
  p: GetCompressedTokenBalancesByOwnerRequest
) => Promise<GetCompressedTokenBalancesByOwnerResponse>;

/** Response from `getCompressedTokenBalancesByOwner` (V2 — uses `items` instead of `token_balances`). */
export interface GetCompressedTokenBalancesByOwnerV2Response {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Base58-encoded cursor to fetch the next page; omitted when no more results exist. */
    cursor?: string;
    /** List of compressed token balances grouped by mint. */
    items: TokenBalance[];
  };
}

/** Get compressed token balances by owner (V2). */
export type GetCompressedTokenBalancesByOwnerV2Fn = (
  p: GetCompressedTokenBalancesByOwnerRequest
) => Promise<GetCompressedTokenBalancesByOwnerV2Response>;

// ── Compression Signatures ──────────────────────────────────────────

/** Request parameters for `getCompressionSignaturesForAccount`. */
export interface GetCompressionSignaturesForAccountRequest {
  /** Base58-encoded 32-byte hash of the compressed account's leaf node. */
  hash: string;
}

/** A transaction signature with slot and block time. */
export interface SignatureInfo {
  /** Base58-encoded transaction signature. */
  signature: string;
  /** Slot number in which the transaction was confirmed. */
  slot: number;
  /** Unix timestamp in seconds of when the transaction was processed. */
  blockTime: number;
}

/** Response from `getCompressionSignaturesForAccount`. */
export interface GetCompressionSignaturesForAccountResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** List of transaction signatures that affected this compressed account. */
    items: SignatureInfo[];
  };
}

/** Get signatures for a specific compressed account. */
export type GetCompressionSignaturesForAccountFn = (
  p: GetCompressionSignaturesForAccountRequest
) => Promise<GetCompressionSignaturesForAccountResponse>;

/** Request parameters for `getCompressionSignaturesForAddress`. */
export interface GetCompressionSignaturesForAddressRequest {
  /** Address to query signatures for. */
  address: string;
  /** Pagination cursor. */
  cursor?: string | null;
  /** Maximum results per page. */
  limit?: number | null;
}

/** A paginated list of signature info entries. */
export interface PaginatedSignatureInfoList {
  cursor?: string | null;
  items: SignatureInfo[];
}

/** Response from `getCompressionSignaturesForAddress`. */
export interface GetCompressionSignaturesForAddressResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

/** Get compression-related signatures for an address. */
export type GetCompressionSignaturesForAddressFn = (
  p: GetCompressionSignaturesForAddressRequest
) => Promise<GetCompressionSignaturesForAddressResponse>;

/** Request parameters for `getCompressionSignaturesForOwner`. */
export interface GetCompressionSignaturesForOwnerRequest {
  /** Owner address to query. */
  owner: string;
  cursor?: string | null;
  limit?: number | null;
}

/** Response from `getCompressionSignaturesForOwner`. */
export interface GetCompressionSignaturesForOwnerResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

/** Get compression-related signatures for an owner. */
export type GetCompressionSignaturesForOwnerFn = (
  p: GetCompressionSignaturesForOwnerRequest
) => Promise<GetCompressionSignaturesForOwnerResponse>;

/** Request parameters for `getCompressionSignaturesForTokenOwner`. */
export interface GetCompressionSignaturesForTokenOwnerRequest {
  /** Token owner address. */
  owner: string;
  cursor?: string | null;
  limit?: number | null;
}

/** Response from `getCompressionSignaturesForTokenOwner`. */
export interface GetCompressionSignaturesForTokenOwnerResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

/** Get compression-related signatures for a token owner. */
export type GetCompressionSignaturesForTokenOwnerFn = (
  p: GetCompressionSignaturesForTokenOwnerRequest
) => Promise<GetCompressionSignaturesForTokenOwnerResponse>;

// ── Indexer Health & Slot ───────────────────────────────────────────

/** Request for `getIndexerHealth` (no parameters). */
export type GetIndexerHealthRequest = Record<string, never>;
/** Response from `getIndexerHealth` — returns `"ok"` when healthy. */
export type GetIndexerHealthResponse = "ok";
/** Check whether the compression indexer is healthy. */
export type GetIndexerHealthFn = () => Promise<GetIndexerHealthResponse>;

/** Request for `getIndexerSlot` (no parameters). */
export type GetIndexerSlotRequest = Record<string, never>;
/** Response from `getIndexerSlot` — the latest indexed slot number. */
export type GetIndexerSlotResponse = number;
/** Get the latest slot indexed by the compression indexer. */
export type GetIndexerSlotFn = () => Promise<GetIndexerSlotResponse>;

// ── Latest Signatures ───────────────────────────────────────────────

/** Request parameters for `getLatestCompressionSignatures`. */
export interface GetLatestCompressionSignaturesRequest {
  cursor?: string | null;
  limit?: number | null;
}

/** Response from `getLatestCompressionSignatures`. */
export interface GetLatestCompressionSignaturesResponse {
  context: { slot: number };
  value: PaginatedSignatureInfoList;
}

/** Get the most recent compression-related signatures. */
export type GetLatestCompressionSignaturesFn = (
  p?: GetLatestCompressionSignaturesRequest
) => Promise<GetLatestCompressionSignaturesResponse>;

/** Request parameters for `getLatestNonVotingSignatures`. */
export interface GetLatestNonVotingSignaturesRequest {
  /** Pagination cursor from a previous response; omit to start from the most recent signatures. */
  cursor?: string | null;
  /** Maximum number of signatures to return per page. */
  limit?: number | null;
}

/** A signature info entry that may include a transaction error. */
export interface SignatureInfoWithError {
  /** Base58-encoded transaction signature. */
  signature: string;
  /** Slot number in which the transaction was confirmed. */
  slot: number;
  /** Unix timestamp in seconds of when the transaction was processed. */
  blockTime: number;
  /** Error message if the transaction failed; `null` for successful transactions. */
  error?: string | null;
}

/** A list of signature info entries with potential errors. */
export interface SignatureInfoListWithError {
  /** List of non-voting transaction signatures, ordered from most recent to oldest. */
  items: SignatureInfoWithError[];
}

/** Response from `getLatestNonVotingSignatures`. */
export interface GetLatestNonVotingSignaturesResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** List of the most recent non-voting transaction signatures with error info. */
  value: SignatureInfoListWithError;
}

/** Get the most recent non-voting signatures. */
export type GetLatestNonVotingSignaturesFn = (
  p?: GetLatestNonVotingSignaturesRequest
) => Promise<GetLatestNonVotingSignaturesResponse>;

// ── Multiple Account Operations ─────────────────────────────────────

/** Array of base58-encoded 32-byte leaf hashes identifying the compressed accounts to fetch proofs for. */
export type GetMultipleCompressedAccountProofsRequest = string[];

/** Response from `getMultipleCompressedAccountProofs`. */
export interface GetMultipleCompressedAccountProofsResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Array of Merkle proofs, one per requested hash, returned in the same order as the request. */
  value: MerkleProofWithContext[];
}

/** Get Merkle proofs for multiple compressed accounts in a batch. */
export type GetMultipleCompressedAccountProofsFn = (
  hashes: GetMultipleCompressedAccountProofsRequest
) => Promise<GetMultipleCompressedAccountProofsResponse>;

/** Request parameters for `getMultipleCompressedAccounts`. */
export interface GetMultipleCompressedAccountsRequest {
  /** Array of base58-encoded public keys of the compressed accounts to retrieve; provide either this or `hashes`, not both. */
  addresses?: string[] | null;
  /** Array of base58-encoded 32-byte leaf hashes of the compressed accounts to retrieve; provide either this or `addresses`, not both. */
  hashes?: string[] | null;
}

/** Response from `getMultipleCompressedAccounts`. */
export interface GetMultipleCompressedAccountsResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  value: {
    /** Compressed accounts in the same order as the requested addresses or hashes; `null` for accounts that were not found. */
    items: (CompressedAccount | null)[];
  };
}

/** Get multiple compressed accounts by address or hash. */
export type GetMultipleCompressedAccountsFn = (
  p: GetMultipleCompressedAccountsRequest
) => Promise<GetMultipleCompressedAccountsResponse>;

// ── New Address Proofs ──────────────────────────────────────────────

/** Array of base58-encoded public keys of the new addresses to generate non-inclusion proofs for. */
export type GetMultipleNewAddressProofsRequest = readonly string[];

/** Merkle proof context for a new address (non-inclusion proof). */
export interface MerkleContextWithNewAddressProof {
  /** Base58-encoded public key of the new address being proven not to exist in the tree. */
  address: string;
  /** Base58-encoded address of the lower range neighbor in the indexed Merkle tree (the largest existing address below `address`). */
  lowerRangeAddress: string;
  /** Base58-encoded address of the higher range neighbor in the indexed Merkle tree (the smallest existing address above `address`). */
  higherRangeAddress: string;
  /** Next available leaf index in the Merkle tree. */
  nextIndex: number;
  /** Leaf index of the lower range neighbor element in the Merkle tree. */
  lowElementLeafIndex: number;
  /** Base58-encoded public key of the address Merkle tree. */
  merkleTree: string;
  /** Base58-encoded current root hash of the Merkle tree. */
  root: string;
  /** Sequence number of the root; used to verify the proof is against the latest root. */
  rootSeq: bigint | number;
  /** Sibling hashes (base58) along the path from the low element leaf to the root. */
  proof: string[];
}

/** Response from `getMultipleNewAddressProofs`. */
export interface GetMultipleNewAddressProofsResponse {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Array of non-inclusion proofs, one per requested address, in the same order as the request. */
  value: MerkleContextWithNewAddressProof[];
}

/** An address paired with its Merkle tree (for V2 proof requests). */
export interface AddressWithTree {
  /** Base58-encoded public key of the new address. */
  address: string;
  /** Base58-encoded public key of the address Merkle tree to prove non-inclusion in. */
  tree: string;
}

/** Request for `getMultipleNewAddressProofsV2` — addresses with their trees. */
export type GetMultipleNewAddressProofsV2Request = readonly AddressWithTree[];

/** Response from `getMultipleNewAddressProofsV2`. */
export interface GetMultipleNewAddressProofsV2Response {
  /** Slot context at the time of the request. */
  context: { slot: number };
  /** Array of non-inclusion proofs, one per requested address, in the same order as the request. */
  value: MerkleContextWithNewAddressProof[];
}

// ── Transaction Compression Info ────────────────────────────────────

/** A compressed account with optional token data. */
export interface AccountWithOptionalTokenData {
  /** The compressed account data. */
  account: CompressedAccount;
  /** Token-specific data if this is a compressed token account; absent for non-token accounts. */
  optionalTokenData?: {
    /** Raw token balance (in the token's smallest unit). */
    amount: number;
    /** Base58-encoded public key of the delegate authority, if one is set. */
    delegate?: string;
    /** Base58-encoded public key of the token mint. */
    mint: string;
    /** Base58-encoded public key of the token account owner. */
    owner: string;
    /** Account state: `initialized` for active accounts, `frozen` for frozen accounts. */
    state: "initialized" | "frozen";
    /** Base64-encoded token extension data (TLV format); present for Token-2022 accounts with extensions. */
    tlv?: string;
  };
}

/** Compression state changes in a transaction. */
export interface CompressionInfo {
  /** Accounts closed by this transaction. */
  closedAccounts: AccountWithOptionalTokenData[];
  /** Accounts opened by this transaction. */
  openedAccounts: AccountWithOptionalTokenData[];
}

/** Request parameters for `getTransactionWithCompressionInfo`. */
export interface GetTransactionWithCompressionInfoRequest {
  /** Base58-encoded transaction signature to retrieve compression info for. */
  signature: string;
}

/** Response from `getTransactionWithCompressionInfo`. */
export interface GetTransactionWithCompressionInfoResponse {
  /** Compression state changes (accounts opened and closed) caused by this transaction. */
  compression_info: CompressionInfo;
  /** The raw transaction as returned by the Solana RPC `getTransaction` method (encoded confirmed transaction with status meta). */
  transaction: unknown;
}

// ── Validity Proofs ─────────────────────────────────────────────────

/** A Groth16 compressed proof (a, b, c curve points). */
export interface CompressedProof {
  /** First component (G1 point) of the Groth16 zero-knowledge proof, base64-encoded. */
  a: string;
  /** Second component (G2 point) of the Groth16 zero-knowledge proof, base64-encoded. */
  b: string;
  /** Third component (G1 point) of the Groth16 zero-knowledge proof, base64-encoded. */
  c: string;
}

/** A compressed validity proof with Merkle tree context. */
export interface CompressedProofWithContext {
  /** The Groth16 zero-knowledge proof components (a, b, c curve points). */
  compressedProof: CompressedProof;
  /** Zero-based indices of the leaves in their respective Merkle trees; positionally aligned with `leaves` and `merkleTrees`. */
  leafIndices: number[];
  /** Base58-encoded leaf hashes of the compressed accounts being proven. */
  leaves: string[];
  /** Base58-encoded public keys of the state Merkle trees containing the proven accounts; positionally aligned with `leaves`. */
  merkleTrees: string[];
  /** Sequence indices of the roots used in the proof; positionally aligned with `roots`. */
  rootIndices: bigint[] | number[];
  /** Base58-encoded root hashes of the Merkle trees at the time the proof was generated. */
  roots: string[];
}

/** Request parameters for `getValidityProof`. */
export interface GetValidityProofRequest {
  /** Array of base58-encoded 32-byte leaf hashes of the compressed accounts to prove inclusion for. */
  hashes?: readonly string[] | null;
  /** Array of new address/tree pairs to generate non-inclusion proofs for. */
  newAddressesWithTrees?: readonly AddressWithTree[] | null;
}

/** Response from `getValidityProof`. */
export interface GetValidityProofResponse {
  /** Slot context at the time the proof was generated. */
  context: { slot: number };
  /** The validity proof and Merkle tree context. */
  value: CompressedProofWithContext;
}

/** Get a ZK validity proof for account inclusion and address non-inclusion. */
export type GetValidityProofFn = (
  p: GetValidityProofRequest
) => Promise<GetValidityProofResponse>;

// ── Asset Signatures (ZK) ───────────────────────────────────────────

/** An operation type on a compressed asset. */
export type AssetOp =
  | "MintToCollectionV1"
  | "MintV1"
  | "Burn"
  | "Transfer"
  | "Sale"
  | string; // Fallback for future ops

/** A [signature, operation] tuple for compressed asset history. */
export type SignatureOpPair = [signature: string, op: AssetOp];

/** Request parameters for `getSignaturesForAsset` (ZK). */
export interface GetSignaturesForAssetRequest {
  /** Asset ID. */
  id: string;
  /** 1-indexed page number. */
  page: number;
  /** Maximum results per page. */
  limit?: number | null;
  /** Cursor for backward pagination. */
  before?: string | null;
  /** Cursor for forward pagination. */
  after?: string | null;
}

/** Response from `getSignaturesForAsset` (ZK). */
export interface GetSignaturesForAssetResponse {
  total: number;
  limit: number;
  /** Array of [signature, operation] tuples. */
  items: SignatureOpPair[];
}

/** Get signatures for a compressed asset. */
export type GetSignaturesForAssetFn = (
  p: GetSignaturesForAssetRequest
) => Promise<GetSignaturesForAssetResponse>;

// ── Additional Function Types ───────────────────────────────────────

/** Get a transaction with its compression state changes. */
export type GetTransactionWithCompressionInfoFn = (
  p: GetTransactionWithCompressionInfoRequest
) => Promise<GetTransactionWithCompressionInfoResponse>;

/** Get new address non-inclusion proofs (V1). */
export type GetMultipleNewAddressProofsFn = (
  p: GetMultipleNewAddressProofsRequest
) => Promise<GetMultipleNewAddressProofsResponse>;

/** Get new address non-inclusion proofs (V2 — with tree specification). */
export type GetMultipleNewAddressProofsV2Fn = (
  p: GetMultipleNewAddressProofsV2Request
) => Promise<GetMultipleNewAddressProofsV2Response>;

/** Get compressed accounts by owner. */
export type GetCompressedAccountsByOwnerFn = (
  p: GetCompressedAccountsByOwnerRequest
) => Promise<GetCompressedAccountsByOwnerResponse>;

/** Get a Merkle proof for a compressed account. */
export type GetCompressedAccountProofFn = (
  p: GetCompressedAccountProofRequest
) => Promise<GetCompressedAccountProofResponse>;

/** Get a single compressed account by address or hash. */
export type GetCompressedAccountFn = (
  p: GetCompressedAccountRequest
) => Promise<GetCompressedAccountResponse>;
