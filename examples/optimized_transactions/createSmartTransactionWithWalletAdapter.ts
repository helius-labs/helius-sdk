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

  // Simulate a wallet adapter's publicKey and signTransaction method
  const mockWallet = Keypair.generate(); // Replace with loaded keypair

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

  const { transaction, blockhash, minContextSlot } =
    await helius.rpc.createSmartTransactionWithWalletAdapter(
      instructions,
      payer,
      signTransaction,
      lookupTables,
      {
        priorityFeeCap: 1_000_000, // 0.001 SOL max tip
      }
    );

  console.log("Smart transaction created and signed using wallet adapter!");
  console.log("Blockhash:", blockhash.blockhash);
  console.log("Min context slot:", minContextSlot);
  console.log("Signed transaction (base58):", transaction.serialize().toString("base64"));
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
