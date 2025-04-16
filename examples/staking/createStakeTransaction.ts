import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import { PublicKey } from "@solana/web3.js";

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const ownerPubkey = new PublicKey('YourWalletPublicKeyHere'); // Replace with your actual pubkey

  const { serializedTx, stakeAccountPubkey } = await helius.rpc.createStakeTransaction(
    ownerPubkey,
    1.5 // Amount in SOL (excluding rent exemption)
  );

  console.log('Stake Account:', stakeAccountPubkey.toBase58());
  console.log('Serialized Transaction:', serializedTx);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
