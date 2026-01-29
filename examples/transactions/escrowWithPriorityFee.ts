import { createHelius } from "helius-sdk";
import {
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

const ESCROW_PROGRAM_ID = new PublicKey("YourEscrowProgram111111111111111111111111111");

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });
  const payer = Keypair.generate(); // Your keypair

  const escrowAddress = new PublicKey("EscrowPDA1111111111111111111111111111111111");

  try {
    // High priority for time-sensitive ops (release, dispute)
    const fee = await helius.rpc.getPriorityFeeEstimate({
      accountKeys: [escrowAddress.toBase58(), ESCROW_PROGRAM_ID.toBase58()],
      options: { priorityLevel: "high" },
    });
    console.log("Priority fee:", fee.priorityFeeEstimate);

    const tx = new Transaction();
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: fee.priorityFeeEstimate,
      })
    );
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 100_000,
      })
    );
    // tx.add(yourEscrowInstruction);

    const signature = await helius.rpc.sendSmartTransaction(tx.instructions, [payer]);
    console.log("Sent:", signature);

  } catch (error) {
    console.error("Error:", error);
  }
})();
