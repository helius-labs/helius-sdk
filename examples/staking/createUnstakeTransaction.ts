import { createHelius } from "helius-sdk";
import { address, createKeyPairSignerFromBytes } from "@solana/kit";
import bs58 from "bs58";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  // Replace with actual address
  const STAKE_ACCOUNT = address("");

  try {
    const ownerSigner = await createKeyPairSignerFromBytes(
      bs58.decode(process.env.FEEPAYER_SECRET ?? "")
    );

    const { serializedTx } = await helius.stake.createUnstakeTransaction(
      ownerSigner,
      STAKE_ACCOUNT
    );

    console.log("\n— Unstake TX built —");
    console.log("Base64 length:", serializedTx.length);

    console.log("\nSimulating…");
    const sim = await helius.simulateTransaction(serializedTx, {
      encoding: "base64",
      commitment: "confirmed",
      replaceRecentBlockhash: false,
      innerInstructions: true,
    });

    const v: any = sim.value;
    console.log("Simulation result");
    console.log(
      "unitsConsumed: ",
      v.unitsConsumed?.toString?.() ?? v.unitsConsumed
    );
    console.log("err: ", v.err ?? "none");

    if (Array.isArray(v.logs)) {
      console.log("log tail: ", v.logs.slice(-5));
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
