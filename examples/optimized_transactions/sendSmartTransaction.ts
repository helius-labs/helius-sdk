import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const fromKeypair = Keypair.generate(); // Replace with actual keypair (or load from file/wallet)
  const fromPubkey = fromKeypair.publicKey;
  const toPubkey = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace with recipient pubkey

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: 0.5 * LAMPORTS_PER_SOL,
    }),
  ];

  const txSignature = await helius.rpc.sendSmartTransaction(
    instructions,
    [fromKeypair],
    [],
    { skipPreflight: true }
  );

  console.log(`Successful transfer: ${txSignature}`);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
