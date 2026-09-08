import {
  pipe,
  createTransactionMessage,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageFeePayer,
  setTransactionMessageLoadedAccountsDataSizeLimit,
  appendTransactionMessageInstructions,
  Address,
  TransactionMessage,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithFeePayer,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";
import { CreateTxMessageInput } from "./types";
import {
  assertNoAddressLookupsOnV1,
  MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES,
} from "./validateTxMessage";

/**
 * Creates an empty transaction message of any version.
 *
 * `@solana/kit` builds, compiles, and encodes version `1` messages at runtime,
 * but `createTransactionMessage`'s type signature still excludes `1` — it is
 * declared as `Exclude<TransactionVersion, 1>`. The cast bridges that gap, and
 * the return type is restated so a v1 caller is handed a message typed as v1
 * rather than as the legacy/v0 union kit would infer. Remove both once kit
 * widens the signature.
 */
export const createEmptyTxMessage = <TVersion extends TransactionVersion>(
  version: TVersion
) =>
  createTransactionMessage({
    version: version as Exclude<TransactionVersion, 1>,
  }) as unknown as Extract<TransactionMessage, { version: TVersion }>;

/**
 * SIMD-0385 treats an absent v1 header-config field as 0, so on version `1`
 * the returned message pre-sets the loaded-accounts-data-size limit to the
 * 64 MiB maximum (`MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES`) — a 0-byte budget
 * fails account loading while still paying fees. Override it with kit's
 * `setTransactionMessageLoadedAccountsDataSizeLimit`. The compute-unit limit
 * and priority fee are NOT pre-set (they need simulation): set them with
 * `setTransactionMessageComputeUnitLimit` and
 * `setTransactionMessagePriorityFeeLamports` before sending, or build via
 * `createSmartTransaction`. `ComputeBudgetProgram` ixs do not configure v1;
 * they execute as paid no-ops.
 *
 * The return type is stated explicitly rather than inferred. Kit does not
 * export `V1TransactionConfig`, so an inferred type that structurally includes
 * it cannot be named in the emitted declarations (TS2742).
 */
export const createTxMessage = <
  TVersion extends TransactionVersion = TransactionVersion,
>({
  version,
  feePayer,
  lifetime,
  instructions,
}: CreateTxMessageInput<TVersion>): Extract<
  TransactionMessage,
  { version: TVersion }
> &
  TransactionMessageWithFeePayer &
  Partial<TransactionMessageWithBlockhashLifetime> => {
  // Same guard createSmartTransaction applies. Without it kit would silently
  // compile a lookup account into a static address on v1.
  assertNoAddressLookupsOnV1(version, instructions);

  return pipe(
    createEmptyTxMessage(version),
    (m) =>
      version === 1
        ? setTransactionMessageLoadedAccountsDataSizeLimit(
            MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES,
            m
          )
        : m,
    (m) =>
      lifetime ? setTransactionMessageLifetimeUsingBlockhash(lifetime, m) : m,
    (m) =>
      typeof feePayer === "string"
        ? setTransactionMessageFeePayer(feePayer as Address, m)
        : setTransactionMessageFeePayerSigner(
            feePayer as TransactionSigner<string>,
            m
          ),
    (m) => appendTransactionMessageInstructions(instructions, m)
  ) as unknown as Extract<TransactionMessage, { version: TVersion }> &
    TransactionMessageWithFeePayer &
    Partial<TransactionMessageWithBlockhashLifetime>;
};
