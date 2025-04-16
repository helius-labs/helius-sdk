import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const walletAddress = '<wallet address>';

  const response = await helius.rpc.getStakeAccounts(walletAddress);

  console.log('Stake accounts:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
