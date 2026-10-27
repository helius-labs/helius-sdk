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
  /**
   * Original Solana transaction, in `getTransaction`'s shape for the requested
   * `rawTransaction` encoding (with `base64`, `transaction` is `[data, "base64"]`).
   * Present only when a raw transaction is requested.
   */
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

/**
 * Encoding of the raw Solana transaction returned next to each parsed one, in
 * `getTransaction`'s shape: `none` (no raw transaction), `json`, `jsonParsed`,
 * or `base64`.
 */
export type ParsedEventsRawTransactionEncoding =
  | "none"
  | "json"
  | "jsonParsed"
  | "base64";

/** Execution result to include. For `scan`, filtering happens before matching, so excluded transactions don't count toward the budget. */
export type ParsedEventsStatusFilter = "succeeded" | "failed" | "any";

/**
 * Which transactions that reference only a token account owned by the
 * address (not the address itself) are included: `none` leaves them out,
 * `balanceChanged` includes those that change the token account's balance,
 * `all` includes all of them.
 */
export type ParsedEventsTokenAccountsFilter = "none" | "balanceChanged" | "all";

/** Request parameters for `parsedEvents.parseTransactions` (POST /v1/parsed-events/transactions). */
export interface ParseTransactionsRequest {
  /** Transaction signatures to parse (max 100). Results are returned in the same order, including duplicates. */
  transactions: string[];
  /** Commitment level. Defaults to `confirmed`. */
  commitment?: ParsedEventsCommitment;
  /** Return each original transaction as `rawTransaction` in this encoding. Defaults to `none`. */
  rawTransaction?: ParsedEventsRawTransactionEncoding;
  /**
   * @deprecated Use `rawTransaction: "json"`, which `true` is an alias for.
   * `true` together with `rawTransaction` is rejected with a 400; `false` is
   * the default and isn't sent.
   */
  includeRawTransaction?: boolean;
}

/** Response from `parsedEvents.parseTransactions`. */
export type ParseTransactionsResponse = ParsedTransactionResult[];

/** Window, cursor, filter, and output options shared by `getTransactionHistory` and `parsedEvents.scan`. */
export interface ParsedHistoryWindowOptions {
  /** Only transactions before this signature. */
  beforeSignature?: string;
  /** Only transactions after this signature. */
  afterSignature?: string;
  /** Cursor returned by a previous request as `paginationToken`. `null` is ignored, so a response's token can be passed straight back. */
  paginationToken?: string | null;
  /** Order in which history is walked and results are returned. Defaults to `desc` (newest first). */
  sortOrder?: ParsedEventsSortOrder;
  /** Commitment level. Defaults to `confirmed`. */
  commitment?: ParsedEventsCommitment;
  /**
   * Execution result to include. Defaults to `succeeded`, so failed
   * transactions are left out unless you pass `any` or `failed`.
   */
  status?: ParsedEventsStatusFilter;
  /** Transactions that reference only a token account owned by the address. Defaults to `none` (left out). */
  tokenAccounts?: ParsedEventsTokenAccountsFilter;
  /** Minimum slot at which the request can be evaluated. */
  minContextSlot?: number;
  /** Return each original transaction as `rawTransaction` in this encoding. Defaults to `none`. */
  rawTransaction?: ParsedEventsRawTransactionEncoding;
  /** Slot comparison bounds. */
  slot?: ComparisonBounds;
  /** Block-time comparison bounds in whole Unix seconds (e.g. `Math.floor(Date.now() / 1000)`). */
  time?: ComparisonBounds;
}

/** Request parameters for `parsedEvents.getTransactionHistory` (POST /v1/parsed-events/transaction-history). */
export interface GetParsedTransactionHistoryRequest extends ParsedHistoryWindowOptions {
  /** Address whose transaction history should be fetched. Program-wide history is not supported; to search a program's history, or any history by instruction or token mint, use `parsedEvents.scan` (for a program's own address, give mints `scope: "transaction"`). */
  address: string;
  /** Number of transactions to return, an integer from 1 to 100. Defaults to 100. */
  limit?: number;
  /**
   * @deprecated Use `rawTransaction: "json"`, which `true` is an alias for.
   * `true` together with `rawTransaction` is rejected with a 400; `false` is
   * the default and isn't sent.
   */
  includeRawTransaction?: boolean;
}

/** Response from `parsedEvents.getTransactionHistory`. */
export interface GetParsedTransactionHistoryResponse {
  /** Parsed transaction results for this page. */
  data: ParsedTransactionResult[];
  /** Cursor for the next page. Absent when the end of the available range is reached. */
  paginationToken?: string | null;
}

/**
 * Where a program's instructions or a mint's balances must be to count:
 * - `address` (default): they involve the scanned `address`. An instruction
 *   counts when one of its accounts is the address, a token account the address
 *   owns, or a token account whose mint is the address, or when the address is
 *   the program. A token balance counts when its token account is the address,
 *   is owned by the address, or its mint is the address.
 * - `transaction`: anywhere in the transaction, e.g. when the address only pays
 *   the fee or executes a multisig transaction, or to find transactions of a
 *   token's mint that also hold the token it trades against.
 *
 * Token account ownership comes from the token balances' `owner`; in older
 * transactions that don't record it, only the address itself counts.
 */
export type ScanMatchScope = "address" | "transaction";

/**
 * Match transactions with an instruction of `programId`, top-level or inner
 * (CPI), in `scope`. `instructions` and `discriminators` combine: an
 * instruction matches when its data starts with any of them. Set neither to
 * match any instruction of the program.
 */
export interface ScanProgramMatch {
  /** Program address. Each program can appear once in `match.programs`. */
  programId: string;
  /**
   * Instruction names from any IDL version of the program, as the IDL spells
   * them or in snake_case (at most 50). A name not in the program's IDLs is
   * rejected with a 400.
   */
  instructions?: string[];
  /**
   * Instruction data prefixes, each 1 to 8 hex-encoded bytes with an optional
   * `0x` prefix (at most 50). Use these for programs without an IDL.
   */
  discriminators?: string[];
  /** Which of the program's instructions count. Defaults to `address`, those that involve the scanned address. */
  scope?: ScanMatchScope;
}

/**
 * Match transactions with a pre or post token balance of `mint`, in `scope`,
 * or, for the native SOL pseudo-mint, a lamport change (see `mint`).
 *
 * When the scanned address is a program, its token accounts usually belong
 * to PDAs rather than the program, so use `scope: "transaction"` there.
 */
export interface ScanMintMatch {
  /**
   * Token mint. Each mint can appear once in `match.mints`.
   *
   * The native SOL pseudo-mint `So11111111111111111111111111111111111111111`
   * (wrapped SOL is `…112`) matches on lamports instead, not counting the fee:
   * the address's lamports changed (`address` scope) or any account's did
   * (`transaction` scope). Each account is compared on its own, so lamports
   * that leave and come back within the transaction don't count. This catches
   * SOL a program pays out without a transfer instruction, and also incidental
   * movements such as Jito tips and rent.
   */
  mint: string;
  /** Which of the mint's balances count. Defaults to `address`, those that belong to the scanned address. */
  scope?: ScanMatchScope;
}

/**
 * What a transaction must match. Set `programs`, `mints`, or both; when both
 * are set, a transaction must match both.
 */
export type ScanMatch = {
  /** Programs (1 to 20, each once). Matches when the transaction has an instruction of any of them, in its scope. An empty array counts as unset. */
  programs?: ScanProgramMatch[];
  /** Token mints (1 to 20, each once). Matches when the transaction has a token balance of any of them in its scope, or a lamport change for the native SOL pseudo-mint. An empty array counts as unset. */
  mints?: ScanMintMatch[];
} & ({ programs: ScanProgramMatch[] } | { mints: ScanMintMatch[] });

/**
 * What a scan returns for its matches:
 * - `transactions` (default): `data` holds the parsed matches, up to `limit`
 * - `signatures`: `data` holds a {@link ScanSignature} per match
 * - `count`: no `data`; `scan.matchedTransactions` is the number of matches
 *
 * `signatures` and `count` ignore `limit` and `rawTransaction`: they return
 * every match in the scanned range, and stop only on `windowEnd`, `budget`, or
 * `deadline`.
 */
export type ScanReturnShape = "transactions" | "signatures" | "count";

/** A match returned with `returnShape: "signatures"`. */
export interface ScanSignature {
  /** Transaction signature. */
  signature: string;
  /** Slot containing the transaction. */
  slot: number;
  /** Position of the transaction within its slot. */
  transactionIndex: number;
  /** Unix timestamp (seconds) of the block, when available. */
  blockTime: number | null;
}

/** Limits on how much history one scan request covers. */
export interface ScanBudget {
  /** Most transactions to scan in this request, an integer from 1 to 10,000. Defaults to 10,000. */
  maxScannedTransactions?: number;
}

/**
 * Request parameters for `parsedEvents.scan` (POST /v1/parsed-events/scan).
 * `S` types `returnShape`; it defaults to `transactions`, so use
 * `ScanParsedTransactionHistoryRequest<"count">` (or `<ScanReturnShape>`) for a
 * request object you build ahead of the call with another shape.
 */
export interface ScanParsedTransactionHistoryRequest<
  S extends ScanReturnShape = "transactions",
> extends ParsedHistoryWindowOptions {
  /** Address whose history is scanned. Prefer the narrowest address: every transaction it has counts toward the budget. */
  address: string;
  /** What a transaction must match. */
  match: ScanMatch;
  /** What the response carries for the matches. Defaults to `transactions`. */
  returnShape?: S;
  /** Most matches to return with the `transactions` shape, an integer from 1 to 100. Defaults to 100. Ignored by `signatures` and `count`. */
  limit?: number;
  /** Limits on how much history this request scans. */
  budget?: ScanBudget;
}

/**
 * Why a scan request stopped:
 * - `windowEnd`: reached the end of the history or the requested window; no `paginationToken`
 * - `limit`: returned `limit` matches (`transactions` shape only); the token resumes right after the last match
 * - `budget`: scanned `budget.maxScannedTransactions`; the token resumes at the next history page
 * - `deadline`: reached the request time limit; the token resumes at the next history page
 */
export type ScanStopReason = "windowEnd" | "limit" | "budget" | "deadline";

/** Position of the last transaction a scan request covered, for reporting progress. */
export interface ScannedThrough {
  /** Slot of the last transaction scanned. */
  slot: number;
  /** Block time of the last transaction scanned, in Unix seconds, when available. */
  blockTime: number | null;
}

/** How far a scan request got and why it stopped. */
export interface ScanSummary {
  /** Why the scan stopped. */
  stoppedOn: ScanStopReason;
  /** Transactions scanned in this request. */
  scannedTransactions: number;
  /** Matches found in this request. With `returnShape: "count"`, this is the result. */
  matchedTransactions: number;
  /** Position of the last transaction scanned. Absent when nothing was scanned. */
  scannedThrough?: ScannedThrough;
  /** Credits charged: 10 per request plus 1 per history page scanned (a page is up to 1,000 transactions). */
  creditsCharged: number;
}

/** Fields of every `parsedEvents.scan` response, whatever its `returnShape`. */
export interface ScanResponseBase {
  /** Cursor where the next scan continues. Absent once the scan reaches the end of the history or window. */
  paginationToken?: string | null;
  /** How far this request got and why it stopped. */
  scan: ScanSummary;
}

/** Response from `parsedEvents.scan` with the default `transactions` shape. */
export interface ScanTransactionsResponse extends ScanResponseBase {
  /** Parsed matches, in `sortOrder`. Can be empty while a `paginationToken` is still returned. */
  data: ParsedTransactionResult[];
}

/** Response from `parsedEvents.scan` with `returnShape: "signatures"`. */
export interface ScanSignaturesResponse extends ScanResponseBase {
  /** Every match in the scanned range, in `sortOrder`. */
  data: ScanSignature[];
}

/** Response from `parsedEvents.scan` with `returnShape: "count"`. The count is `scan.matchedTransactions`. */
export interface ScanCountResponse extends ScanResponseBase {
  data?: undefined;
}

/** Response from `parsedEvents.scan`, by `returnShape`. */
export type ScanParsedTransactionHistoryResponse<
  S extends ScanReturnShape = "transactions",
> = S extends "count"
  ? ScanCountResponse
  : S extends "signatures"
    ? ScanSignaturesResponse
    : ScanTransactionsResponse;
