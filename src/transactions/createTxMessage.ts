import {
  pipe,
  createTransactionMessage,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageFeePayer,
  appendTransactionMessageInstructions,
  Address,
  TransactionMessage,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithFeePayer,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";
import { CreateTxMessageInput } from "./types";
import { assertNoAddressLookupsOnV1 } from "./validateTxMessage";

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
