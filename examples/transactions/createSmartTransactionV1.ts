import { createHelius } from "helius-sdk";
import { address, createKeyPairSignerFromBytes, lamports } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import bs58 from "bs58";

/**
 * Version 1 transactions (SIMD-0385) raise the size limit from 1,232 to 4,096
 * bytes (SIMD-0296).
 *
 * Two things differ from v0:
 *   1. The compute-unit limit and priority fee ride in the transaction header
 *      instead of `ComputeBudgetProgram` instructions, so a v1 transaction is
 *      actually *smaller* on the wire than the v0 equivalent.
 *   2. Address lookup tables are not supported — every account the transaction
 *      touches must be listed inline (max 64).
 *
 * Other v1 caps: 64 instructions, 12 signatures, 255 accounts per instruction.
 */
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
      signers: [feePayerSigner],
      instructions: [transferIx], // No compute-budget ixs — they're no-ops on v1
      version: 1,
      commitment: "confirmed",
      minUnits: 1_000,
      bufferPct: 0.1, // 10% headroom
      // Optional: cap the rate (µ-lamports per CU) the estimate is allowed to hit
      // priorityFeeCap: 80_000,
      // Optional: cap what the transaction actually spends on priority, in lamports.
      // v1 pays a total rather than a per-CU rate, so this is the natural budget knob
      // priorityFeeLamportsCap: 50_000,
    });

    console.log("— createSmartTransaction({ version: 1 }) result —");
    console.log("CU limit:", smart.units);
    console.log("Priority fee (µ-lamports per CU):", smart.priorityFee);
    console.log("Priority fee (total lamports):", smart.priorityFeeLamports);
    console.log("Lifetime:", smart.lifetime);
    console.log("Base64 length:", smart.base64.length);

    // The budget lives here on v1, rather than in leading instructions
    console.log("Header config:", (smart.message as { config?: unknown }).config);
  } catch (error) {
    console.error("Error:", error);
  }
})();
