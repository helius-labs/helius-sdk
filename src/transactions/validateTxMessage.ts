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
 *
 * Tests the value rather than the key, so an account that merely spreads an
 * explicit `lookupTableAddress: undefined` is not mistaken for a lookup.
 */
const isLookupAccount = (account: unknown): boolean =>
  typeof account === "object" &&
  account !== null &&
  (account as { lookupTableAddress?: unknown }).lookupTableAddress != null;

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
 * failure surfaces locally rather than as an opaque rejection from the network.
 *
 * Kit's `SolanaError` propagates untouched on every version, so
 * `isSolanaError(err, SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT)` is a
 * reliable check regardless of which version produced it. The remedy for an
 * oversized legacy or v0 transaction — version 1's larger limit — is
 * documentation rather than something to encode in a wrapper error, since
 * wrapping would make the thrown type depend on the version.
 */
export const assertWithinSizeLimit = (
  message: TransactionMessage & TransactionMessageWithFeePayer
): void => assertIsTransactionMessageWithinSizeLimit(message);
