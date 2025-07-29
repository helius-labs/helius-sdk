import type {
  BlockhashLifetime,
  CreateSmartTxDeps,
  CreateSmartTxInput,
  CreateSmartTxResult,
  SignedTx,
} from "./types";
import type { Instruction, TransactionSigner } from "@solana/kit";

import {
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  prependTransactionMessageInstructions,
  appendTransactionMessageInstructions,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  address,
} from "@solana/kit";

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";

const COMPUTE_BUDGET_PROGRAM_ADDRESS = address(
  "ComputeBudget111111111111111111111111111111"
);

const isComputeBudgetIx = (ix: Instruction<string, readonly any[]>) =>
  ix.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS;

const firstSigner = (
  signers: readonly TransactionSigner<string>[]
): TransactionSigner<string> => {
  if (!signers.length)
    throw new Error("createSmartTransaction: expected at least one signer.");
  return signers[0];
};

const resolveFeePayerSigner = (
  signers: readonly TransactionSigner<string>[],
  feePayer?: CreateSmartTxInput["feePayer"]
): TransactionSigner<string> => {
  if (!feePayer) return firstSigner(signers);

  if (typeof feePayer !== "string") {
    // Already a TransactionSigner
    return feePayer as TransactionSigner<string>;
  }

  // Fee payer is an Address — find matching signer
  const s = signers.find((s) => s.address === feePayer);

  if (!s) {
    throw new Error(
      `createSmartTransaction: feePayer address (${feePayer}) was provided but no matching TransactionSigner found in 'signers'.`
    );
  }

  return s;
};

export const makeCreateSmartTransaction = ({
  raw,
  getComputeUnits,
  getPriorityFeeEstimate,
}: CreateSmartTxDeps) => {
  const create = async ({
    signers,
    instructions,
    version = 0,
    priorityFeeCap,
    minUnits = 1_000,
    bufferPct = 0.1,
    commitment = "confirmed",
    feePayer,
  }: CreateSmartTxInput): Promise<CreateSmartTxResult> => {
    const feePayerSigner = resolveFeePayerSigner(signers, feePayer);
    const userIxs = instructions.filter((ix) => !isComputeBudgetIx(ix));

    // Draft message for CU estimation & fee sampling
    const { value: initialLifetime } = await raw
      .getLatestBlockhash({ commitment })
      .send();

    const draftMsg = pipe(
      createTransactionMessage({ version }),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(initialLifetime, m),
      (m) => appendTransactionMessageInstructions(userIxs, m)
    );

    // Estimate compute units with floor + buffer
    const units = await getComputeUnits(draftMsg, { min: minUnits, bufferPct });

    // Sign the draft and get recommended fees
    const draftSigned = await signTransactionMessageWithSigners(draftMsg);
    const draftBase64 = getBase64EncodedWireTransaction(draftSigned);

    const { priorityFeeEstimate } = await getPriorityFeeEstimate({
      transaction: draftBase64,
      options: { transactionEncoding: "base64", recommended: true },
    });

    if (priorityFeeEstimate == null) {
      throw new Error(
        "Priority fee estimate not available. Error creating smart transaction."
      );
    }

    const priorityFee =
      priorityFeeCap != null
        ? Math.min(priorityFeeEstimate, priorityFeeCap)
        : priorityFeeEstimate;

    // Refresh blockhash to avoid expiry window
    const { value: finalLifetime } = await raw
      .getLatestBlockhash({ commitment })
      .send();

    // Build the final message (fee payer → lifetime → compute budget → user ixs)
    const finalMsg = pipe(
      createTransactionMessage({ version }),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(finalLifetime, m),
      (m) =>
        prependTransactionMessageInstructions(
          [
            getSetComputeUnitPriceInstruction({
              microLamports: Number(priorityFee),
            }),
            getSetComputeUnitLimitInstruction({ units: Number(units) }),
          ] as const,
          m
        ),
      (m) => appendTransactionMessageInstructions(userIxs, m)
    );

    // Final sign & return
    const finalSigned = await signTransactionMessageWithSigners(finalMsg);
    const base64 = getBase64EncodedWireTransaction(finalSigned);

    return {
      signed: finalSigned as SignedTx,
      base64,
      units: Number(units),
      priorityFee: Number(priorityFee),
      lifetime: finalLifetime as BlockhashLifetime,
      message: finalMsg,
    };
  };

  return { create };
};
