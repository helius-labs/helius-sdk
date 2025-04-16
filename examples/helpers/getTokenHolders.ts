import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const tokenMint = '<token mint address>';

  const response = await helius.rpc.getTokenHolders(tokenMint);

  console.log('Token holders:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
