import type {
  BlockhashLifetime,
  CreateSmartTxDeps,
  CreateSmartTxInput,
  CreateSmartTxResult,
  SignedTx,
} from "./types";
import type {
  Address,
  Instruction,
  TransactionMessage,
  TransactionMessageWithFeePayer,
  TransactionSigner,
} from "@solana/kit";

import {
  compileTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  prependTransactionMessageInstructions,
  appendTransactionMessageInstructions,
  setTransactionMessageComputeUnitLimit,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessagePriorityFeeLamports,
  signTransactionMessageWithSigners,
} from "@solana/kit";

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";

import { createEmptyTxMessage } from "./createTxMessage";
import { resolvePriorityFee } from "./priorityFee";
import {
  assertNoAddressLookupsOnV1,
  assertWithinSizeLimit,
} from "./validateTxMessage";

const COMPUTE_BUDGET_PROGRAM_ADDRESS =
  "ComputeBudget111111111111111111111111111111" as Address;

/** The version 1 arm of kit's `TransactionMessage` union. */
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

const isComputeBudgetIx = (ix: Instruction<string, readonly any[]>) =>
  ix.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS;

/**
 * Every account address a message references, deduplicated, as the fee API's
 * `accountKeys` expects. Compiling is what resolves the fee payer, program IDs,
 * and instruction accounts into one ordered list.
 */
const getAccountKeys = (
  message: TransactionMessage & TransactionMessageWithFeePayer
): string[] => [...compileTransactionMessage(message).staticAccounts];

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
    priorityFeeLamportsCap,
    minUnits = 1_000,
    bufferPct = 0.1,
    commitment = "confirmed",
    feePayer,
  }: CreateSmartTxInput): Promise<CreateSmartTxResult> => {
    const feePayerSigner = resolveFeePayerSigner(signers, feePayer);
    const userIxs = instructions.filter((ix) => !isComputeBudgetIx(ix));

    // Fail before spending two RPC round-trips on a transaction that can't be built
    assertNoAddressLookupsOnV1(version, userIxs);

    // Draft message for CU estimation & fee sampling
    const { value: initialLifetime } = await raw
      .getLatestBlockhash({ commitment })
      .send();

    const draftMsg = pipe(
      createEmptyTxMessage(version),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(initialLifetime, m),
      (m) => appendTransactionMessageInstructions(userIxs, m)
    );

    // The final message only grows from here, so an oversized draft is already
    // doomed. Checking now fails before the caller is asked for any signature.
    assertWithinSizeLimit(draftMsg);

    // Estimate compute units with floor + buffer
    const units = await getComputeUnits(draftMsg, { min: minUnits, bufferPct });

    /**
     * Version 1 is priced by account key rather than by serialized transaction.
     *
     * The fee API reads the v0 wire format, so handing it a v1 transaction
     * risks an unusable estimate — and this call is the only reason a draft
     * would be signed at all, since compute-unit estimation compiles the
     * unsigned message itself. Pricing v1 by account key removes both the
     * dependency and a signature the caller never agreed to.
     */
    const { priorityFeeEstimate } = await getPriorityFeeEstimate(
      version === 1
        ? {
            accountKeys: getAccountKeys(draftMsg),
            options: { recommended: true },
          }
        : {
            transaction: getBase64EncodedWireTransaction(
              await signTransactionMessageWithSigners(draftMsg)
            ),
            options: { transactionEncoding: "base64", recommended: true },
          }
    );

    if (priorityFeeEstimate == null) {
      throw new Error(
        "Priority fee estimate not available. Error creating smart transaction."
      );
    }

    const { rate: priorityFee, lamports: priorityFeeLamports } =
      resolvePriorityFee({
        estimate: priorityFeeEstimate,
        units: Number(units),
        rateCap: priorityFeeCap,
        lamportsCap: priorityFeeLamportsCap,
      });

    // Refresh blockhash to avoid expiry window
    const { value: finalLifetime } = await raw
      .getLatestBlockhash({ commitment })
      .send();

    /**
     * Applies the compute budget in the form the transaction's version expects.
     *
     * Version 1 carries the limit and the total priority fee in its header
     * config; emitting `ComputeBudgetProgram` instructions there would be a
     * no-op that still consumes bytes and compute units (SIMD-0385). Legacy and
     * v0 keep the prepended price-then-limit instruction pair.
     */
    const applyComputeBudget = <TMessage extends TransactionMessage>(
      m: TMessage
    ): TMessage => {
      if (version === 1) {
        return pipe(
          m,
          (msg) => setTransactionMessageComputeUnitLimit(Number(units), msg),
          // `version` is only known at runtime here, so the compiler can't
          // narrow the union down to the v1 variant this setter requires.
          (msg) => msg as unknown as V1TransactionMessage,
          (msg) =>
            setTransactionMessagePriorityFeeLamports(priorityFeeLamports, msg)
        ) as unknown as TMessage;
      }

      return prependTransactionMessageInstructions(
        [
          getSetComputeUnitPriceInstruction({
            microLamports: Number(priorityFee),
          }),
          getSetComputeUnitLimitInstruction({ units: Number(units) }),
        ] as const,
        m
      ) as TMessage;
    };

    // Build the final message (fee payer → lifetime → compute budget → user ixs)
    const finalMsg = pipe(
      createEmptyTxMessage(version),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(finalLifetime, m),
      (m) => applyComputeBudget(m),
      (m) => appendTransactionMessageInstructions(userIxs, m)
    );

    // Surface an oversized transaction here rather than at the wallet prompt
    assertWithinSizeLimit(finalMsg);

    // Final sign & return
    const finalSigned = await signTransactionMessageWithSigners(finalMsg);
    const base64 = getBase64EncodedWireTransaction(finalSigned);

    return {
      signed: finalSigned as SignedTx,
      base64,
      units: Number(units),
      priorityFee: Number(priorityFee),
      priorityFeeLamports,
      lifetime: finalLifetime as BlockhashLifetime,
      message: finalMsg,
    };
  };

  return { create };
};
