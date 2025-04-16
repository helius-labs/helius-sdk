import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting
import { PublicKey } from "@solana/web3.js";

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const recipient = new PublicKey('<wallet address>');

  const response = await helius.rpc.airdrop(recipient, 1_000_000_000); // 1 SOL in lamports

  console.log('Airdrop response:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
