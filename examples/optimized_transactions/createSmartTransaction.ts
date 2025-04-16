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

  const feePayer = Keypair.generate(); // Replace with your actual keypair
  const recipient = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace this too

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey: recipient,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    }),
  ];

  const signers = [feePayer];
  const lookupTables: AddressLookupTableAccount[] = [];

  const { transaction, blockhash, minContextSlot } =
    await helius.rpc.createSmartTransaction(
      instructions,
      signers,
      lookupTables,
      {
        feePayer, 
        priorityFeeCap: 1_000_000,
      }
    );

  console.log("Smart transaction created!");
  console.log("Blockhash:", blockhash.blockhash);
  console.log("Min context slot:", minContextSlot);
  console.log("Transaction object:", transaction);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
