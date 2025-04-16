import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const feePayer = Keypair.generate(); // Replace with your actual keypair
  const toPubkey = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace this

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey,
      lamports: 0.05 * LAMPORTS_PER_SOL,
    }),
  ];

  const signers = [feePayer];
  const lookupTables: AddressLookupTableAccount[] = []; // Replace if using ALT
  const tipAmount = 100_000; // 100k microLamports = 0.0001 SOL

  const { transaction, blockhash, minContextSlot } =
    await helius.rpc.createSmartTransactionWithTip(
      instructions,
      signers,
      lookupTables,
      tipAmount,
      {
        feePayer,
      }
    );

  const serializedTransaction = bs58.encode(transaction.serialize());
  const lastValidBlockHeight = blockhash.lastValidBlockHeight;

  console.log("Serialized Transaction (base58):", serializedTransaction);
  console.log("Last Valid Block Height:", lastValidBlockHeight);
  console.log("Min Context Slot:", minContextSlot);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
