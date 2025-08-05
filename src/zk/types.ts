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
