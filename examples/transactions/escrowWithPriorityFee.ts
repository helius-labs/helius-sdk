import { createHelius } from "helius-sdk";

import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getTransferSolInstruction } from "@solana-program/system";
import bs58 from "bs58";

const ESCROW_PROGRAM_ID = address("YourEscrowProgram111111111111111111111111111");

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const feePayerSigner = await createKeyPairSignerFromBytes(
      bs58.decode(process.env.FEEPAYER_SECRET ?? "")
    );

    const escrowAddress = address("EscrowPDA1111111111111111111111111111111111");

    const { priorityFeeEstimate } = await helius.getPriorityFeeEstimate({
      accountKeys: [escrowAddress, ESCROW_PROGRAM_ID],
      options: { priorityLevel: "High" },
    });

    const microLamports = priorityFeeEstimate ?? 0;
    console.log("Priority fee (µ-lamports/CU):", microLamports);

    // Replace this with your escrow-program instruction (release, refund, dispute, etc).
    // We're using a plain SOL transfer as a runnable placeholder.
    const escrowIx = getTransferSolInstruction({
      amount: lamports(1_000_000n), // 0.001 SOL
      destination: escrowAddress,
      source: feePayerSigner,
    });

    const { value: latestBlockhash } = await helius.getLatestBlockhash();

    const draftMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) => appendTransactionMessageInstructions([escrowIx], m)
    );

    const units = await helius.tx.getComputeUnits(draftMessage);

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) =>
        appendTransactionMessageInstructions(
          [
            getSetComputeUnitPriceInstruction({ microLamports }),
            getSetComputeUnitLimitInstruction({ units }),
            escrowIx,
          ] as const,
          m
        )
    );

    const signed = await signTransactionMessageWithSigners(message);
    const wireTx64 = getBase64EncodedWireTransaction(signed);

    const signature = await helius.tx.sendTransaction(wireTx64, {
      skipPreflight: true,
    });

    console.log("Sent:", signature);
    console.log(
      `Explorer link: https://orb.helius.dev/tx/${signature}?cluster=mainnet`
    );
  } catch (error) {
    console.error("Error:", error);
  }
})();
