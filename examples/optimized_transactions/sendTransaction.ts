import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const sender = Keypair.generate(); // Replace with your loaded keypair
  const recipient = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace with recipient

  const { blockhash } = await helius.connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: sender.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    })
  );

  transaction.sign(sender);

  const signature = await helius.rpc.sendTransaction(transaction, {
    skipPreflight: true,
    preflightCommitment: "confirmed",
  });

  console.log(`Transaction sent! Signature: ${signature}`);
  console.log(`Explorer: https://orb.helius.dev/tx/${signature}`);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
