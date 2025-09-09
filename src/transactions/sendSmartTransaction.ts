// src/transactions/sendSmartTransaction.ts
import type {
  SendSmartTxDeps,
  SendSmartTransactionFn,
  SendSmartTransactionInput,
} from "./types";
import {
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from "@solana/kit";

export const makeSendSmartTransaction = ({
  raw,
  rpcSubscriptions,
  createSmartTransaction,
}: SendSmartTxDeps) => {
  const send: SendSmartTransactionFn = async ({
    // Defaults
    confirmCommitment = "confirmed",
    maxRetries = 0n,
    skipPreflight = true,
    ...rest
  }: SendSmartTransactionInput) => {
    // Build & sign
    const { signed } = (await createSmartTransaction(rest)) as any;

    // Send + confirm
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc: raw,
      // Undefined is fine at runtime; cast to silence TS
      rpcSubscriptions: rpcSubscriptions as any,
    });

    await sendAndConfirm(signed, {
      commitment: confirmCommitment,
      maxRetries,
      skipPreflight,
    });

    // Return the sig
    return getSignatureFromTransaction(signed);
  };

  return { send };
};
