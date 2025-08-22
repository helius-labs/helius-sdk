// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";
import { address, createKeyPairSignerFromBytes, lamports } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import bs58 from "bs58";
import { SFDP_REJECTS_URL } from "../../src/transactions/types";

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
      instructions: [transferIx],
      version: 0,
      commitment: "confirmed",
      minUnits: 1_000,
      bufferPct: 0.1,
    });

    const sig = await helius.tx.sendTransaction(smart, {
      validatorAcls: [SFDP_REJECTS_URL],
      skipPreflight: true,
    });

    console.log("Confirmed signature:", sig);
    console.log(
      `Explorer link: https://orb.helius.dev/tx/${sig}?cluster=mainnet`
    );
  } catch (error) {
    console.error("Error:", error);
  }
})();
