import { TransactionVersion, Address, TransactionSigner, Instruction, Blockhash, Commitment, CompilableTransactionMessage, Rpc, SolanaRpcApi, signTransactionMessageWithSigners, RpcSubscriptions, SolanaRpcSubscriptionsApi } from "@solana/kit";

import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { GetComputeUnitsFn } from "./getComputeUnits";

export interface GetComputeUnitsOpts {
  // The floor for very small transactions. We default to 1k
  min?: number;
  // The buffer applied on top of simulated CU. We default to 10%
  bufferPct?: number;
};

export type SignedTx = Awaited<ReturnType<typeof signTransactionMessageWithSigners>>;

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

export type CreateSmartTxInput = Readonly<{
  /** All required signers. First signer is the default fee‑payer. */
  signers: readonly TransactionSigner<string>[];
  /** Program instructions (no compute‑budget ixs needed — we’ll add them). */
  instructions: readonly Instruction<string, readonly any[]>[];
  /** Optional fee‑payer override (Address or TransactionSigner). */
  feePayer?: Address | TransactionSigner<string>;
  /** Tx version. Default: 0. */
  version?: TransactionVersion;
  /** Optional cap (µ‑lamports per CU) applied to Helius’ recommendation. */
  priorityFeeCap?: number;
  /** CU floor & simulation buffer. Defaults: 1_000 / 10%. */
  minUnits?: number;
  bufferPct?: number;
  /** Commitment for fetching the blockhash. Default: "confirmed". */
  commitment?: Commitment;
}>;

export type CreateSmartTxResult = Readonly<{
  /** Final signed transaction (ready to send). */
  signed: SignedTx;
  /** Base‑64 wire transaction of the final signed tx. */
  base64: string;
  /** Final compute‑unit limit set by the SDK. */
  units: number;
  /** Final microLamports‑per‑CU set by the SDK. */
  priorityFee: number;
  /** Final blockhash + lastValidBlockHeight used for the message. */
  lifetime: BlockhashLifetime;
  /** Final message (after compute‑budget ixs are prepended). */
  message: CompilableTransactionMessage;
}>;

export type CreateSmartTxDeps = Readonly<{
  raw: Rpc<SolanaRpcApi>;
  getComputeUnits: GetComputeUnitsFn;
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;
}>;

export type CreateSmartTransactionFn = (args: CreateSmartTxInput) => Promise<CreateSmartTxResult>;

export type SendSmartTransactionInput = CreateSmartTxInput & {
  /** Confirmation commitment for the send+confirm step. Default: "confirmed". */
  confirmCommitment?: Commitment; // "processed" | "confirmed" | "finalized"
  /** Forwarded to sendAndConfirm; default 0n. */
  maxRetries?: bigint;
  /** Forwarded to sendAndConfirm; default true. */
  skipPreflight?: boolean;
};

export type SendSmartTransactionFn = (
  args: SendSmartTransactionInput
) => Promise<string>;

export type SendSmartTxDeps = Readonly<{
  raw: Rpc<SolanaRpcApi>;
  /** Optional but recommended — enables WS-backed confirmation */
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  /** We compose on top of the creator to reuse your smart build/sign logic */
  createSmartTransaction: CreateSmartTransactionFn;
}>;

