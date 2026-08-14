import { lamports } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

import {
  type CreateSmartTxResult,
  type CreateSmartTxWithTipInput,
  CreateSmartTransactionFn,
  CreateSmartTransactionWithTipFn,
  MIN_TIP_LAMPORTS_MAX,
  SENDER_TIP_ACCOUNTS,
} from "./types";

export const makeCreateSmartTransactionWithTip = (
  createSmartTransaction: CreateSmartTransactionFn
): { create: CreateSmartTransactionWithTipFn } => {
  const createWithTip: CreateSmartTransactionWithTipFn = async (
    args: CreateSmartTxWithTipInput
  ): Promise<CreateSmartTxResult> => {
    const feePayer =
      typeof args.feePayer === "string"
        ? args.signers.find((s) => s.address === args.feePayer)
        : (args.feePayer ?? args.signers[0]);

    if (!feePayer) {
      throw new Error(
        "createSmartTransactionWithTip: could not resolve a fee payer signer"
      );
    }

    // Random tip account to avoid CU lockouts
    const randomTipAccount =
      SENDER_TIP_ACCOUNTS[
        Math.floor(Math.random() * SENDER_TIP_ACCOUNTS.length)
      ];

    const tipIx = getTransferSolInstruction({
      source: feePayer,
      destination: randomTipAccount,
      amount: lamports(BigInt(args.tipAmount ?? MIN_TIP_LAMPORTS_MAX)),
    });

    return createSmartTransaction({
      ...args,
      // Append tip IX so it appears before user instructions
      instructions: [...args.instructions, tipIx],
    });
  };

  return { create: createWithTip };
};
