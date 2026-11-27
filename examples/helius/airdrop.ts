import { generateKeyPairSigner } from "@solana/kit";
import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard

  // Airdrops are devnet-only; on mainnet helius.airdrop rejects without sending
  const helius = createHelius({ apiKey, network: "devnet" });

  try {
    const wallet = await generateKeyPairSigner();

    // Requests 1 SOL and resolves once the airdrop is confirmed
    const signature = await helius.airdrop(wallet.address, 1_000_000_000n);
    console.log("Airdrop signature: ", signature);

    const { value: balance } = await helius.getBalance(wallet.address);
    console.log("Balance (lamports): ", balance);
  } catch (error) {
    // The devnet faucet is rate-limited; retry later if it refuses
    console.error("Error requesting airdrop: ", error);
  }
})();
