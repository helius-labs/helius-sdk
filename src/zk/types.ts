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
};

export interface AccountData {
  discriminator: number;
  data: string; // Base64
  dataHash: string;
};

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
};

export interface PaginatedAccountList {
  cursor?: string;
  items: CompressedAccount[];
};

export interface GetCompressedAccountsByOwnerResponse {
  context: { slot: number };
  value: PaginatedAccountList;
};
