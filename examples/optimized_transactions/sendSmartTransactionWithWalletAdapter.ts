import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Transaction,
  VersionedTransaction,
  AddressLookupTableAccount,
} from "@solana/web3.js";

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  // Simulated wallet adapter
  const mockWallet = Keypair.generate(); // Replace with your keypair
  const payer = mockWallet.publicKey;

  const signTransaction = async <T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> => {
    if (tx instanceof VersionedTransaction) {
      tx.sign([mockWallet]);
    } else {
      tx.partialSign(mockWallet);
    }
    return tx;
  };

  const recipient = new PublicKey("TARGET_WALLET_ADDRESS"); // Replace this
  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
  ];

  const lookupTables: AddressLookupTableAccount[] = [];

  const signature = await helius.rpc.sendSmartTransactionWithWalletAdapter(
    instructions,
    payer,
    signTransaction,
    lookupTables,
    {
      priorityFeeCap: 1_000_000, // 0.001 SOL tip cap
      skipPreflight: true,
      pollTimeoutMs: 60_000,
      pollIntervalMs: 2_000,
      pollChunkMs: 10_000,
      lastValidBlockHeightOffset: 150,
      preflightCommitment: "confirmed",
    }
  );

  console.log(`Transaction confirmed: ${signature}`);
  console.log(`View on Orb: https://orb.helius.dev/tx/${signature}`);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
