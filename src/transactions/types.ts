import {
  TransactionVersion,
  Address,
  TransactionSigner,
  Instruction,
  Blockhash,
  Commitment,
  BaseTransactionMessage,
  TransactionMessageWithFeePayer,
  Rpc,
  SolanaRpcApi,
  signTransactionMessageWithSigners,
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  Signature,
  Base64EncodedWireTransaction,
} from "@solana/kit";

import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { GetComputeUnitsFn } from "./getComputeUnits";

/** Options for the compute-unit simulation step. */
export interface GetComputeUnitsOpts {
  /** Minimum CU floor for very small transactions. Defaults to 1,000. */
  min?: number;
  /** Buffer percentage added on top of simulated CU. Defaults to 0.1 (10%). */
  bufferPct?: number;
}

/** A fully signed transaction ready to be sent over the wire. */
export type SignedTx = Awaited<
  ReturnType<typeof signTransactionMessageWithSigners>
>;

/** A blockhash and its expiry height, used as a transaction lifetime. */
export type BlockhashLifetime = Readonly<{
  blockhash: Blockhash;
  lastValidBlockHeight: bigint;
}>;

/** Input for building a raw transaction message. */
export type CreateTxMessageInput = Readonly<{
  version: TransactionVersion;
  feePayer: Address | TransactionSigner<string>;
  lifetime?: BlockhashLifetime;
  instructions: readonly Instruction<string, readonly any[]>[];
}>;

/**
 * Input for `createSmartTransaction`. The SDK automatically simulates
 * compute units, fetches priority fees, and prepends compute-budget
 * instructions before signing.
 */
export type CreateSmartTxInput = Readonly<{
  /** All required signers. First signer is the default fee-payer. */
  signers: readonly TransactionSigner<string>[];
  /** Program instructions (no compute-budget ixs needed — we'll add them). */
  instructions: readonly Instruction<string, readonly any[]>[];
  /** Optional fee-payer override (Address or TransactionSigner). */
  feePayer?: Address | TransactionSigner<string>;
  /** Tx version. Default: 0. */
  version?: TransactionVersion;
  /** Optional cap (microlamports per CU) applied to Helius' recommendation. */
  priorityFeeCap?: number;
  /** CU floor & simulation buffer. Defaults: 1_000 / 10%. */
  minUnits?: number;
  bufferPct?: number;
  /** Commitment for fetching the blockhash. Default: "confirmed". */
  commitment?: Commitment;
}>;

/** Result from `createSmartTransaction` — a signed transaction with metadata. */
export type CreateSmartTxResult = Readonly<{
  /** Final signed transaction (ready to send). */
  signed: SignedTx;
  /** Base-64 wire transaction of the final signed tx. */
  base64: string;
  /** Final compute-unit limit set by the SDK. */
  units: number;
  /** Final microLamports-per-CU set by the SDK. */
  priorityFee: number;
  /** Final blockhash + lastValidBlockHeight used for the message. */
  lifetime: BlockhashLifetime;
  /** Final message (after compute-budget ixs are prepended). */
  message: BaseTransactionMessage & TransactionMessageWithFeePayer;
}>;

/** Internal dependencies for `createSmartTransaction`. */
export type CreateSmartTxDeps = Readonly<{
  raw: Rpc<SolanaRpcApi>;
  getComputeUnits: GetComputeUnitsFn;
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;
}>;

/** Build, simulate, and sign a smart transaction. */
export type CreateSmartTransactionFn = (
  args: CreateSmartTxInput
) => Promise<CreateSmartTxResult>;

/**
 * Input for `sendSmartTransaction`. Extends `CreateSmartTxInput` with
 * send-and-confirm options.
 */
export type SendSmartTransactionInput = CreateSmartTxInput & {
  /** Confirmation commitment for the send+confirm step. Defaults to `"confirmed"`. */
  confirmCommitment?: Commitment; // "processed" | "confirmed" | "finalized"
  /** Maximum number of automatic retry attempts. Should be `0n` for Sender. */
  maxRetries?: bigint;
  /** Bypasses preflight transaction validation for faster submission. Must be `true` for Sender. Defaults to `true`. */
  skipPreflight?: boolean;
};

/** Build, sign, send, and confirm a smart transaction. Returns the signature. */
export type SendSmartTransactionFn = (
  args: SendSmartTransactionInput
) => Promise<string>;

/** Internal dependencies for `sendSmartTransaction`. */
export type SendSmartTxDeps = Readonly<{
  raw: Rpc<SolanaRpcApi>;
  /** Optional but recommended — enables WS-backed confirmation */
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  /** We compose on top of the creator to reuse your smart build/sign logic */
  createSmartTransaction: CreateSmartTransactionFn;
}>;

/** Options for `broadcastTransaction` — submit to the Helius Sender and poll for confirmation. */
export interface BroadcastOptions {
  /** Number of slots to add to the current block height when computing the transaction expiry. */
  lastValidBlockHeightOffset?: number;
  /** Overall polling timeout in milliseconds. Defaults to 60,000. */
  pollTimeoutMs?: number;
  /** Polling cadence in milliseconds. Defaults to 2,000. */
  pollIntervalMs?: number;
  /**
   * Bypasses Solana's preflight transaction validation for faster submission.
   * **Must be `true` when submitting via Helius Sender.** Defaults to `true`.
   */
  skipPreflight?: boolean;
  /** Maximum number of automatic retry attempts. Should be set to `0` for Sender. */
  maxRetries?: bigint;
  /** Confirmation commitment level to wait for. */
  commitment?: "processed" | "confirmed" | "finalized";
  /**
   * When `true`, routes exclusively through SWQOS infrastructure.
   * Has a lower minimum tip requirement than the default dual-routing mode.
   */
  swqosOnly?: boolean;
}

/** Options for polling transaction confirmation status. */
export interface PollTxOptions {
  /** Commitment levels to poll for. */
  confirmationStatuses?: ("processed" | "confirmed" | "finalized")[];
  /** Timeout in milliseconds before giving up. */
  timeout?: number;
  /** Polling interval in milliseconds. */
  interval?: number;
  /** Stop polling if the block height exceeds this. */
  lastValidBlockHeight?: bigint | number;
}

/** Poll for a transaction's confirmation status. Returns the signature once confirmed. */
export type PollTransactionConfirmationFn = (
  signature: Signature,
  options?: PollTxOptions
) => Promise<Signature>;

/** Broadcast a base-64 wire transaction and poll until confirmed. */
export type BroadcastTransactionFn = (
  wireTx64: string | Base64EncodedWireTransaction,
  options?: BroadcastOptions
) => Promise<string>;

/**
 * Regional Helius sender endpoints for SWQOS transaction submission.
 *
 * `Default` uses HTTPS and is suitable for frontend/browser applications.
 * All other regions use HTTP and are intended for server-side use.
 */
export const SENDER_ENDPOINTS = {
  /** Global HTTPS endpoint — suitable for frontend applications. */
  Default: "https://sender.helius-rpc.com",
  /** Salt Lake City, USA. */
  US_SLC: "http://slc-sender.helius-rpc.com",
  /** Newark, USA. */
  US_EAST: "http://ewr-sender.helius-rpc.com",
  /** London, UK. */
  EU_WEST: "http://lon-sender.helius-rpc.com",
  /** Frankfurt, Germany. */
  EU_CENTRAL: "http://fra-sender.helius-rpc.com",
  /** Amsterdam, Netherlands. */
  EU_NORTH: "http://ams-sender.helius-rpc.com",
  /** Singapore. */
  AP_SINGAPORE: "http://sg-sender.helius-rpc.com",
  /** Tokyo, Japan. */
  AP_TOKYO: "http://tyo-sender.helius-rpc.com",
} as const;

/** A region key for the Helius sender infrastructure. */
export type SenderRegion = keyof typeof SENDER_ENDPOINTS;

/** Build the `/fast` endpoint URL for a sender region. */
export const senderFastUrl = (region: SenderRegion) =>
  `${SENDER_ENDPOINTS[region]}/fast`;

/** Build the `/ping` endpoint URL for a sender region. GET this URL to keep the connection warm. */
export const senderPingUrl = (region: SenderRegion) =>
  `${SENDER_ENDPOINTS[region]}/ping`;

/** Input for `createSmartTransactionWithTip` — adds a Jito/sender tip instruction. */
export interface CreateSmartTxWithTipInput extends CreateSmartTxInput {
  /** Tip amount in lamports. Defaults to 500,000. */
  tipAmount?: number;
}

/** Build a smart transaction that includes a tip instruction. */
export type CreateSmartTransactionWithTipFn = (
  args: CreateSmartTxWithTipInput
) => Promise<CreateSmartTxResult>;

/** Options for `sendTransactionWithSender` — route through Helius sender infra. */
export interface SendViaSenderOptions {
  /** Sender region to route through. */
  region: SenderRegion;
  /** Route only through SWQOS infrastructure. */
  swqosOnly?: boolean;
  /** Overall polling timeout in milliseconds. */
  pollTimeoutMs?: number;
  /** Polling cadence in milliseconds. */
  pollIntervalMs?: number;
  /** Explicit lamport tip override. */
  tipAmount?: number;
}

/** Build, tip, and send a transaction via the Helius sender infrastructure. */
export type SendTransactionWithSenderFn = (
  args: Omit<CreateSmartTxWithTipInput, "tipAmount"> & SendViaSenderOptions
) => Promise<string>;

/** Internal dependencies for `sendTransactionWithSender`. */
export interface SendSmartTxSenderDeps {
  raw: Rpc<SolanaRpcApi>;
  createSmartTransactionWithTip: (
    i: CreateSmartTxWithTipInput
  ) => Promise<CreateSmartTxResult>;
}

/** Tip account addresses used by the Helius sender infrastructure. */
export const SENDER_TIP_ACCOUNTS: Address[] = [
  "4ACfpUFoaSD9bfPdeu6DBt89gB6ENTeHBXCAi87NhDEE" as Address,
  "D2L6yPZ2FmmmTKPgzaMKdhu6EWZcTpLy1Vhx8uvZe7NZ" as Address,
  "9bnz4RShgq1hAnLnZbP8kbgBg1kEmcJBYQq3gQbmnSta" as Address,
  "5VY91ws6B2hMmBFRsXkoAAdsPHBJwRfBht4DXox3xkwn" as Address,
  "2nyhqdwKcJZR2vcqCyrYsaPVdAnFoJjiksCXJ7hfEYgD" as Address,
  "2q5pghRs6arqVjRvT5gfgWfWcHWmw1ZuCzphgd5KfWGJ" as Address,
  "wyvPkWjVZz1M8fHQnMMCDTQDbkManefNNhweYk5WkcF" as Address,
  "3KCKozbAaF75qEU33jtzozcJ29yJuaLJTy2jFdzUY8bT" as Address,
  "4vieeGHPYPG2MmyPRcYjdiDmmhN3ww7hsFNap8pVN3Ey" as Address,
  "4TQLFNWK8AovT1gFvda5jfw2oJeRMKEmw7aH6MGBJ3or" as Address,
] as const;

/** Minimum tip for dual (SWQOS + Jito) submission — 0.001 SOL. */
export const MIN_TIP_LAMPORTS_DUAL = 1_000_000n;
/** Minimum tip for SWQOS-only submission — 0.0005 SOL. */
export const MIN_TIP_LAMPORTS_SWQOS = 500_000n;

/** Options for the low-level `sendTransaction` helper. */
export interface HeliusSendOptions {
  skipPreflight?: boolean;
  maxRetries?: number;
  minContextSlot?: number;
  preflightCommitment?: string;
  validatorAcls?: string[];
}

/** A transaction in any supported format that can be sent. */
export type SendableTransaction =
  | Base64EncodedWireTransaction
  | { serialize(): Uint8Array }
  | { base64: string }
  | { signed: unknown };

/** Send a pre-signed transaction. Returns the signature. */
export type SendTransactionFn = (
  tx: SendableTransaction,
  opts?: HeliusSendOptions
) => Promise<Signature>;

/** URL for the SFDP rejects list. */
export const SFDP_REJECTS_URL =
  "https://helius-docs.s3.us-east-2.amazonaws.com/sfdp_rejects.json";
