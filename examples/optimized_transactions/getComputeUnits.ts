import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const payer = Keypair.generate(); // Replace with your actual keypair
  const recipient = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace with recipient address

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
  ];

  const computeUnits = await helius.rpc.getComputeUnits(
    instructions,
    payer.publicKey,
    [], // Address lookup tables
    []  // Signers
  );

  console.log("Estimated compute units:", computeUnits);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
