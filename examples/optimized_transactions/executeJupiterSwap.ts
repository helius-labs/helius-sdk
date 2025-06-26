import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import { Keypair } from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const wallet = Keypair.generate(); // Replace with your actual keypair

  const result = await helius.rpc.executeJupiterSwap(
    {
      inputMint: "So11111111111111111111111111111111111111112", // SOL
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
      amount: 10_000_000, // 0.01 SOL (9 decimals)
      slippageBps: 50, // 0.5% slippage
      restrictIntermediateTokens: true,
      priorityLevel: "high", // 'medium' (25th percentile) | 'high' (50th percentile) | 'veryHigh' (75th percentile)
      maxPriorityFeeLamports: 1_000_000, // 0.001 SOL
      skipPreflight: true,
      confirmationCommitment: "confirmed",
    },
    wallet
  );

  if (result.success && result.confirmed) {
    console.log(`Swap successful! Received ${result.outputAmount} USDC`);
    console.log(`Transaction: https://orb.helius.dev/tx/${result.signature}`);
  } else {
    console.error("Swap failed:", result);
  }
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
