import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  AddressLookupTableAccount,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const fromKeypair = Keypair.generate(); // Replace with your loaded keypair
  const fromPubkey = fromKeypair.publicKey;
  const toPubkey = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace with the recipient address

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: 0.05 * LAMPORTS_PER_SOL,
    }),
  ];

  // If you're using address lookup tables, load them here
  const addressLUTs: AddressLookupTableAccount[] = [];

  const bundleId = await helius.rpc.sendSmartTransactionWithTip(
    instructions,
    [fromKeypair],         // Signers
    addressLUTs,           // Address lookup tables
    100_000,               // Tip amount (in microLamports)
    "NY"                   // Region
  );

  console.log(`Bundle sent successfully with ID: ${bundleId}`);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
