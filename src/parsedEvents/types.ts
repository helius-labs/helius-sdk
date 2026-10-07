import type { HeliusRpcOptions } from "../rpc/types";

/** The `createHelius()` options that say which network a Parsed Events client targets. */
export type ParsedEventsNetworkOptions = Pick<
  HeliusRpcOptions,
  "network" | "baseUrl"
>;

/** Commitment level for Parsed Events queries. `processed` is not supported. */
export type ParsedEventsCommitment = "confirmed" | "finalized";

/** Sort order for Parsed Events transaction history. */
export type ParsedEventsSortOrder = "asc" | "desc";

/** `OK` when the transaction executed successfully, `ERROR` when execution failed. */
export type ParsedTransactionStatus = "OK" | "ERROR";

/** Integer comparison bounds. Each bound is optional; fractional values are rejected by the API. */
export interface ComparisonBounds {
  /** Match values greater than this value. */
  gt?: number;
  /** Match values greater than or equal to this value. */
  gte?: number;
  /** Match values less than this value. */
  lt?: number;
  /** Match values less than or equal to this value. */
  lte?: number;
}

/** A SOL movement detected at transaction level. */
export interface ParsedNativeTransfer {
  /** Account sending lamports. */
  fromUserAccount: string | null;
  /** Account receiving lamports. */
  toUserAccount: string | null;
  /** Amount in lamports. A JSON number, so values above `Number.MAX_SAFE_INTEGER` lose precision. */
  amount: number;
}

/** An SPL Token or Token-2022 movement detected at transaction level. */
export interface ParsedTokenTransfer {
  /** Owner or authority for the source side, when known. */
  fromUserAccount: string | null;
  /** Owner for the destination side, when known. */
  toUserAccount: string | null;
  /** Source token account. */
  fromTokenAccount: string | null;
  /** Destination token account. */
  toTokenAccount: string | null;
  /**
   * Raw integer token amount. Divide by `10 ** decimals` for the UI amount.
   * Delivered as a JSON number, so amounts above `Number.MAX_SAFE_INTEGER`
   * (~9.007e15) lose precision; the matching instruction's `decoded.args`
   * carries the exact u64 as a string.
   */
  rawTokenAmount: number;
  /** Mint decimals used to interpret `rawTokenAmount`. */
  decimals: number;
  /** Token standard when known (e.g. `"Fungible"`, `"UnknownStandard"`). */
  tokenStandard: string;
  /** Token mint address. */
  mint: string;
}

/** Human-readable summary for a transaction or instruction. */
export interface ParsedSummary {
  /** Summary type (e.g. `"swap"`, `"transfer"`, `"create_account"`). */
  type: string;
  /** Human-readable summary text. */
  description: string;
  /**
   * Structured payload behind the summary, when available — e.g. swap
   * metadata with `protocol`, `kind`, amounts, and mints. The shape varies by
   * summary type and protocol.
   */
  parsedData: Record<string, unknown> | null;
}

/** Named account used by a decoded instruction. */
export interface DecodedAccount {
  /** Parser-known account name (snake_case). */
  name: string;
  /** Account public key. */
  pubkey: string;
  /** Whether the account signed the transaction. */
  isSigner: boolean;
  /** Whether the account was writable for the instruction. */
  isWritable: boolean;
}

/** Decoded instruction args and named accounts. */
export interface DecodedInstruction {
  /** Decoded instruction arguments. Names and shapes depend on the instruction; u64 values arrive as strings. */
  args: Record<string, unknown>;
  /** Decoded instruction accounts with parser-known names. */
  accounts: DecodedAccount[];
}

/** A parsed top-level or inner (CPI) instruction. */
export interface ParsedInstruction {
  /** Top-level instruction index. */
  instructionIndex: number;
  /** Inner instruction index within the top-level instruction, or `null` for top-level instructions. */
  innerInstructionIndex: number | null;
  /** Stack height, when available. */
  stackHeight: number | null;
  /** Program ID that executed the instruction. */
  programId: string;
  /** Account pubkeys resolved from the instruction's account indexes. */
  rawAccounts: string[];
  /** Raw instruction data. */
  rawData: string;
  /** Instruction-level summary, when available. */
  summary: ParsedSummary | null;
  /** Parser-known program name (e.g. `"jupiter"`, `"token_2022"`), when available. */
  programName: string | null;
  /** Decoded instruction name (e.g. `"transfer_checked"`), when available. */
  instructionName: string | null;
  /** Decoded args and accounts, when decoding succeeds. */
  decoded: DecodedInstruction | null;
}

/** A custom program error decoded from a failed transaction. */
export interface ParsedDecodedError {
  /** Index of the failing instruction. */
  instructionIndex: number;
  /** Failing program ID. */
  programId: string;
  /** Failing program name. */
  programName: string;
  /** Program error code. */
  code: number;
  /** Program error name. */
  name: string;
  /** Program error message, when available. */
  msg: string | null;
}

/** A transaction parsed by Parsed Events. */
export interface ParsedTransaction {
  /** Slot containing the transaction. */
  slot: number;
  /** Unix timestamp (seconds) of the block, when available. */
  blockTime: number | null;
  /** Transaction fee in lamports. */
  fee: number;
  /** Fee payer account, when available. */
  feePayer: string | null;
  /** Whether the transaction executed successfully. Failed transactions are still parsed. */
  transactionStatus: ParsedTransactionStatus;
  /** Raw execution error when `transactionStatus` is `ERROR`. */
  error?: unknown;
  /** Custom program error decoded from `error`, when available. */
  decodedError?: ParsedDecodedError | null;
  /** Transaction-level SOL transfers in lamports. */
  nativeTransfers: ParsedNativeTransfer[];
  /** Transaction-level SPL Token and Token-2022 transfers. */
  tokenTransfers: ParsedTokenTransfer[];
  /** Best transaction-level summary, or `null` for unrecognized transactions. */
  summary: ParsedSummary | null;
  /** Parsed top-level and inner instructions in execution order. */
  instructions: ParsedInstruction[];
}

/** Item-level parser error. */
export interface ParserError {
  /** Machine-readable error code (e.g. `"transaction_not_found"`). */
  code: string;
  /** Human-readable error message. */
  message: string;
}

/** Fields shared by every `ParsedTransactionResult`, whatever its `parserStatus`. */
export interface ParsedTransactionResultBase {
  /** Transaction signature for this item. */
  signature: string;
  /** Original Solana transaction payload. Present only when `includeRawTransaction` is `true`. */
  rawTransaction?: Record<string, unknown>;
}

/** A successfully fetched and parsed item. */
export interface ParsedTransactionResultOk extends ParsedTransactionResultBase {
  parserStatus: "OK";
  /** Parsed transaction. */
  parsed: ParsedTransaction;
  parserError?: undefined;
}

/** An item that failed to fetch or parse (e.g. `transaction_not_found`). */
export interface ParsedTransactionResultError extends ParsedTransactionResultBase {
  parserStatus: "ERROR";
  parsed?: undefined;
  /** Item-level error. */
  parserError: ParserError;
}

/**
 * Per-signature result. Missing transactions and parser failures come back as
 * items with `parserStatus: "ERROR"` rather than failing the whole request;
 * checking `parserStatus === "OK"` narrows `parsed` to defined.
 */
export type ParsedTransactionResult =
  | ParsedTransactionResultOk
  | ParsedTransactionResultError;

/** Request parameters for `parsedEvents.parseTransactions` (POST /v1/parsed-events/transactions). */
export interface ParseTransactionsRequest {
  /** Transaction signatures to parse (max 100). Results are returned in the same order, including duplicates. */
  transactions: string[];
  /** Commitment level. Defaults to `confirmed`. */
  commitment?: ParsedEventsCommitment;
  /** Include the original Solana transaction payload as `rawTransaction`. Defaults to `false`. */
  includeRawTransaction?: boolean;
}

/** Response from `parsedEvents.parseTransactions`. */
export type ParseTransactionsResponse = ParsedTransactionResult[];

/** Request parameters for `parsedEvents.getTransactionHistory` (POST /v1/parsed-events/transaction-history). */
export interface GetParsedTransactionHistoryRequest {
  /** Address whose transaction history should be fetched. Program-wide scans are not supported. */
  address: string;
  /** Number of transactions to return, an integer from 1 to 100. Defaults to 100. */
  limit?: number;
  /** Return transactions before this signature. */
  beforeSignature?: string;
  /** Return transactions after this signature. */
  afterSignature?: string;
  /** Cursor returned by a previous page as `paginationToken`. `null` is ignored, so a response's token can be passed straight back. */
  paginationToken?: string | null;
  /** Sort order. Defaults to `desc` (newest first). */
  sortOrder?: ParsedEventsSortOrder;
  /** Commitment level. Defaults to `confirmed`. */
  commitment?: ParsedEventsCommitment;
  /** Include raw Solana transaction payloads as `rawTransaction`. Defaults to `false`. */
  includeRawTransaction?: boolean;
  /** Slot comparison bounds. */
  slot?: ComparisonBounds;
  /** Block-time comparison bounds in whole Unix seconds (e.g. `Math.floor(Date.now() / 1000)`). */
  time?: ComparisonBounds;
}

/** Response from `parsedEvents.getTransactionHistory`. */
export interface GetParsedTransactionHistoryResponse {
  /** Parsed transaction results for this page. */
  data: ParsedTransactionResult[];
  /** Cursor for the next page. Absent when the end of the available range is reached. */
  paginationToken?: string | null;
}
