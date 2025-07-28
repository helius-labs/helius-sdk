// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";
import { address, createKeyPairSignerFromBytes, lamports } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import bs58 from "bs58";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const feePayerSigner = await createKeyPairSignerFromBytes(
      bs58.decode(process.env.FEEPAYER_SECRET ?? "")
    );

    const toPubkey = address("your_to_address");

    const transferIx = getTransferSolInstruction({
      amount: lamports(1_000_000n), // 0.001 SOL
      destination: toPubkey,
      source: feePayerSigner,
    });

    const smart = await helius.tx.createSmartTransaction({
      signers: [feePayerSigner], // First signer = fee payer (unless you pass feePayer override)
      instructions: [transferIx], // No compute-budget ixs — SDK will prepend them
      version: 0,
      commitment: "confirmed",
      minUnits: 1_000,
      bufferPct: 0.1, // 10% headroom
      // Optional: cap the priority fee (µ-lamports per CU)
      // priorityFeeCap: 80_000,
    });

    console.log("— createSmartTransaction() result —");
    console.log("CU limit:", smart.units);
    console.log("Priority fee:", smart.priorityFee);
    console.log("Lifetime:", smart.lifetime);
    console.log("Base64 length:", smart.base64.length);
  } catch (error) {
    console.error("Error:", error);
  }
})();
