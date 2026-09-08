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
 * The protocol's maximum — and legacy/v0 implicit default — loaded-accounts
 * data-size limit: 64 MiB. Not exported by `@solana/kit`.
 *
 * Version 1 carries this limit in its header config, and SIMD-0385 treats an
 * absent field as a request for 0 bytes; account loading counts a 64-byte base
 * cost per account, so a 0-byte budget fails every transaction. The SDK
 * therefore always writes a v1 value, using this maximum when the caller does
 * not request less — the same budget legacy and v0 receive implicitly.
 */
export const MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES = 67_108_864;

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
 * Validates a requested loaded-accounts-data-size limit before it is written
 * into a message. The v1 header value is literal (SIMD-0385): `0` is a 0-byte
 * budget that fails account loading while still paying fees, values above the
 * 64 MiB protocol maximum are not honored by the runtime, and kit encodes the
 * field as a u32 — a non-integer throws from deep inside message compilation
 * with no mention of the argument that caused it.
 */
export const assertValidLoadedAccountsDataSizeLimit = (
  limit: number | undefined
): void => {
  if (limit === undefined) return;

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES
  ) {
    throw new Error(
      `loadedAccountsDataSizeLimit must be an integer between 1 and ${MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES} bytes (64 MiB); got ${limit}.`
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
