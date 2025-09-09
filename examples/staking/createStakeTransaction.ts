import { createHelius } from "helius-sdk";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import bs58 from "bs58";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const STAKE_SOL = 0.001;

  try {
    const ownerSigner = await createKeyPairSignerFromBytes(
      bs58.decode(process.env.FEEPAYER_SECRET ?? "")
    );

    const stakeTxDraft = await helius.stake.createStakeTransaction(
      ownerSigner,
      STAKE_SOL
    );

    console.log("\n— Stake TX draft —");
    console.log(
      "Stake account pubkey :",
      stakeTxDraft.stakeAccountPubkey.toString()
    );
    console.log("Base64 length:", stakeTxDraft.serializedTx.length);

    console.log("\nSimulating…");
    const sim = await helius.simulateTransaction(stakeTxDraft.serializedTx, {
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
