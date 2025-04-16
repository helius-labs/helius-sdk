import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  SendOptions,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const feePayer = Keypair.generate(); // Replace with your actual keypair
  const recipient = new PublicKey("TARGET_WALLET_ADDRESS");

  // Build a simple transfer transaction
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
  ];

  const { blockhash } = await helius.connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: feePayer.publicKey,
    recentBlockhash: blockhash,
  }).add(...instructions);

  transaction.sign(feePayer);

  const sendOptions: SendOptions = {
    skipPreflight: true,
    preflightCommitment: "confirmed",
  };

  const txSig = await helius.connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: true,
      ...sendOptions,
    }
  );

  console.log("Sent transaction:", txSig);
  const confirmation = await helius.rpc.pollTransactionConfirmation(txSig);

  console.log("Transaction confirmation:", confirmation);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
