import {
  TransactionVersion,
  Address,
  TransactionSigner,
  Instruction,
  Blockhash,
  Commitment,
  CompilableTransactionMessage,
  Rpc,
  SolanaRpcApi,
  signTransactionMessageWithSigners,
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  address,
  Signature,
  Base64EncodedWireTransaction,
} from "@solana/kit";

import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { GetComputeUnitsFn } from "./getComputeUnits";

export interface GetComputeUnitsOpts {
  // The floor for very small transactions. We default to 1k
  min?: number;
  // The buffer applied on top of simulated CU. We default to 10%
  bufferPct?: number;
}

export type SignedTx = Awaited<
  ReturnType<typeof signTransactionMessageWithSigners>
>;

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

export type CreateSmartTransactionFn = (
  args: CreateSmartTxInput
) => Promise<CreateSmartTxResult>;

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

export interface BroadcastOptions {
  lastValidBlockHeightOffset?: number;
  // Overall polling timeout (ms). Defaults to 60_000 ms
  pollTimeoutMs?: number;
  // polling cadence (ms). Defaults to 2_000 ms
  pollIntervalMs?: number;
  // Defaults to true
  skipPreflight?: boolean;
  maxRetries?: bigint;
  // pls don't use processed
  commitment?: "processed" | "confirmed" | "finalized";
}

export interface PollTxOptions {
  // pls don't use processed
  confirmationStatuses?: ("processed" | "confirmed" | "finalized")[];
  timeout?: number;
  interval?: number;
  lastValidBlockHeight?: bigint | number;
}

export type PollTransactionConfirmationFn = (
  signature: Signature,
  options?: PollTxOptions
) => Promise<Signature>;

export type BroadcastTransactionFn = (
  wireTx64: string | Base64EncodedWireTransaction,
  options?: BroadcastOptions
) => Promise<string>;

export const SENDER_ENDPOINTS = {
  Default: "http://slc-sender.helius-rpc.com",
  US_EAST: "http://ewr-sender.helius-rpc.com",
  EU_WEST: "http://lon-sender.helius-rpc.com",
  EU_CENTRAL: "http://fra-sender.helius-rpc.com",
  EU_NORTH: "http://ams-sender.helius-rpc.com",
  AP_SINGAPORE: "http://sg-sender.helius-rpc.com",
  AP_TOKYO: "http://tyo-sender.helius-rpc.com",
} as const;

export type SenderRegion = keyof typeof SENDER_ENDPOINTS;

// `/fast` endpoint used for sending transactions
export const senderFastUrl = (region: SenderRegion) =>
  `${SENDER_ENDPOINTS[region]}/fast`;

// `/ping` endpoint used for connection warming
export const senderPingUrl = (region: SenderRegion) =>
  `${SENDER_ENDPOINTS[region]}/ping`;

export interface CreateSmartTxWithTipInput extends CreateSmartTxInput {
  // Defaults to 1_000
  tipAmount?: number;
}

export type CreateSmartTransactionWithTipFn = (
  args: CreateSmartTxWithTipInput
) => Promise<CreateSmartTxResult>;

export interface SendViaSenderOptions {
  region: SenderRegion;
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
}

export interface SendViaSenderOptions {
  region: SenderRegion;
  // Route only through SWQOS infra
  swqosOnly?: boolean;
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
  // Optional explicit lamport tip override (optional)
  tipAmount?: number;
}

export type SendTransactionWithSenderFn = (
  args: Omit<CreateSmartTxWithTipInput, "tipAmount"> & SendViaSenderOptions
) => Promise<string>;

export interface SendSmartTxSenderDeps {
  raw: Rpc<SolanaRpcApi>;
  createSmartTransactionWithTip: (
    i: CreateSmartTxWithTipInput
  ) => Promise<CreateSmartTxResult>;
}

export const SENDER_TIP_ACCOUNTS: Address[] = [
  address("4ACfpUFoaSD9bfPdeu6DBt89gB6ENTeHBXCAi87NhDEE"),
  address("D2L6yPZ2FmmmTKPgzaMKdhu6EWZcTpLy1Vhx8uvZe7NZ"),
  address("9bnz4RShgq1hAnLnZbP8kbgBg1kEmcJBYQq3gQbmnSta"),
  address("5VY91ws6B2hMmBFRsXkoAAdsPHBJwRfBht4DXox3xkwn"),
  address("2nyhqdwKcJZR2vcqCyrYsaPVdAnFoJjiksCXJ7hfEYgD"),
  address("2q5pghRs6arqVjRvT5gfgWfWcHWmw1ZuCzphgd5KfWGJ"),
  address("wyvPkWjVZz1M8fHQnMMCDTQDbkManefNNhweYk5WkcF"),
  address("3KCKozbAaF75qEU33jtzozcJ29yJuaLJTy2jFdzUY8bT"),
  address("4vieeGHPYPG2MmyPRcYjdiDmmhN3ww7hsFNap8pVN3Ey"),
  address("4TQLFNWK8AovT1gFvda5jfw2oJeRMKEmw7aH6MGBJ3or"),
] as const;

export const MIN_TIP_LAMPORTS_DUAL = 1_000_000n; // 0.001 SOL
export const MIN_TIP_LAMPORTS_SWQOS = 500_000n; // 0.0005 SOL
