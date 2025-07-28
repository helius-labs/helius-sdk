import { pipe, createTransactionMessage, setTransactionMessageLifetimeUsingBlockhash, setTransactionMessageFeePayerSigner, setTransactionMessageFeePayer, appendTransactionMessageInstructions, Address, TransactionSigner } from "@solana/kit";
import { CreateTxMessageInput } from "./types";

export const createTxMessage = ({
  version,
  feePayer,
  lifetime,
  instructions,
}: CreateTxMessageInput) => {
  return pipe(
    createTransactionMessage({ version }),
    (m) => (lifetime ? setTransactionMessageLifetimeUsingBlockhash(lifetime, m) : m),
    (m) =>
      typeof feePayer === "string"
        ? setTransactionMessageFeePayer(feePayer as Address, m)
        : setTransactionMessageFeePayerSigner(feePayer as TransactionSigner<string>, m),
    (m) => appendTransactionMessageInstructions(instructions, m),
  );
};