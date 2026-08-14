import {
  pipe,
  createTransactionMessage,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageFeePayer,
  appendTransactionMessageInstructions,
  Address,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";
import { CreateTxMessageInput } from "./types";

/**
 * Creates an empty transaction message of any version.
 *
 * `@solana/kit` builds, compiles, and encodes version `1` messages at runtime,
 * but `createTransactionMessage`'s type signature still excludes `1` — it is
 * declared as `Exclude<TransactionVersion, 1>`. The cast bridges that gap so
 * callers get a typed v1 build path. Remove it once kit widens the signature.
 */
export const createEmptyTxMessage = (version: TransactionVersion) =>
  createTransactionMessage({
    version: version as Exclude<TransactionVersion, 1>,
  });

export const createTxMessage = ({
  version,
  feePayer,
  lifetime,
  instructions,
}: CreateTxMessageInput) => {
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
  );
};
