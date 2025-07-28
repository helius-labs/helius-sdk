import { TransactionVersion, Address, TransactionSigner, Instruction, Blockhash } from "@solana/kit";

export interface GetComputeUnitsOpts {
  // The floor for very small transactions. We default to 1k
  min?: number;
  // The buffer applied on top of simulated CU. We default to 10%
  bufferPct?: number;
};

export type BlockhashLifetime = Readonly<{
  blockhash: Blockhash;
  lastValidBlockHeight: bigint;
}>;

export type CreateTxMessageInput = Readonly<{
  version: TransactionVersion;
  feePayer: Address | TransactionSigner<string>;
  lifetime?: BlockhashLifetime;
  instructions: readonly Instruction<string, readonly any[]>[];
}>;
