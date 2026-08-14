import {
  assertIsTransactionMessageWithinSizeLimit,
  type Instruction,
  type TransactionMessage,
  type TransactionMessageWithFeePayer,
  type TransactionVersion,
} from "@solana/kit";

/**
 * Maximum size of a version 1 transaction in bytes (SIMD-0296), versus 1,232
 * for legacy and v0. `@solana/kit` knows both limits but does not export them.
 */
export const V1_TRANSACTION_SIZE_LIMIT = 4096;

/**
 * Detects an instruction account that resolves through an address lookup table.
 * Lookup accounts carry `lookupTableAddress`; static ones only carry `address`.
 */
const isLookupAccount = (account: unknown): boolean =>
  typeof account === "object" &&
  account !== null &&
  "lookupTableAddress" in account;

/**
 * Rejects address lookup tables on version 1 transactions.
 *
 * SIMD-0385 drops lookup table support from the v1 format. Rather than failing,
 * `@solana/kit` silently compiles a lookup account into a static address — so a
 * transaction built to save space via a lookup table would quietly inline every
 * address instead, and can then breach the 64-address cap or the size limit for
 * reasons that are hard to trace back to the lookup table.
 */
export const assertNoAddressLookupsOnV1 = (
  version: TransactionVersion,
  instructions: readonly Instruction<string, readonly any[]>[]
): void => {
  if (version !== 1) return;

  for (const ix of instructions) {
    if (!ix.accounts?.some(isLookupAccount)) continue;

    throw new Error(
      `Version 1 transactions do not support address lookup tables (SIMD-0385), but an instruction for program ${ix.programAddress} sources an account from one. ` +
        `Use version 0, or pass the account's address directly — v1 holds up to 64 addresses inline.`
    );
  }
};

/**
 * Asserts a message fits its version's size limit before it is signed, so the
 * failure surfaces locally rather than as an opaque rejection from the network
 * (or a wallet prompt for a transaction that can never land).
 *
 * Legacy and v0 messages that overflow get a pointer to v1, whose larger limit
 * is the way to send something this size.
 */
export const assertWithinSizeLimit = (
  message: TransactionMessage & TransactionMessageWithFeePayer
): void => {
  try {
    assertIsTransactionMessageWithinSizeLimit(message);
  } catch (cause) {
    if (message.version === 1) throw cause;

    // Error `cause` needs ES2022; the build targets ES2020, so the original
    // message is folded into the new one instead
    throw new Error(
      `${cause instanceof Error ? cause.message : String(cause)} ` +
        `Version 1 transactions allow up to ${V1_TRANSACTION_SIZE_LIMIT} bytes.`
    );
  }
};
