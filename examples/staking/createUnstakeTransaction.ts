import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import { PublicKey } from "@solana/web3.js";

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const ownerPubkey = new PublicKey('YourWalletPublicKeyHere');
  const stakeAccountPubkey = new PublicKey('YourStakeAccountPubkeyHere');

  const serializedTx = await helius.rpc.createUnstakeTransaction(
    ownerPubkey,
    stakeAccountPubkey
  );

  console.log('Serialized Unstake Transaction:', serializedTx);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
