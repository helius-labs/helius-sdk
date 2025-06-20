import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import { Keypair } from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const wallet = Keypair.generate(); // Replace with your actual keypair

  // Example swap using Smart Transactions for improved reliability
  const result = await helius.rpc.executeJupiterSwap(
    {
      inputMint: "So11111111111111111111111111111111111111112", // SOL
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
      amount: 10_000_000, // 0.01 SOL (9 decimals)
      slippageBps: 50, // 0.5% slippage
      restrictIntermediateTokens: true,
      useSmartTransaction: true, // Enable Smart Transactions for better reliability
      skipPreflight: true,
      confirmationCommitment: "confirmed",
    },
    wallet
  );

  if (result.success && result.confirmed) {
    console.log(`Swap successful! Received ${result.outputAmount} USDC`);
    console.log(`Transaction: https://orb.helius.dev/tx/${result.signature}`);
    console.log(`Used Smart Transactions for improved reliability and automatic priority fee optimization`);
  } else {
    console.error("Swap failed:", result);
  }
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
}); 