import { Helius,JITO_TIP_ACCOUNTS } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const feePayer = Keypair.generate(); // Replace with your actual keypair
  const recipient = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace this

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
  ];

  const randomTipAccount =
    JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];
  const tipAmount = 10_000; // microLamports = 0.00001 SOL

  helius.rpc.addTipInstruction(
    instructions,
    feePayer.publicKey,
    randomTipAccount,
    tipAmount
  );

  console.log("Instructions with Jito tip added:");
  console.log(instructions);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
