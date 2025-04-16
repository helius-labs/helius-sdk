import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAssetsByCreator({
    creatorAddress: 'D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3',
    onlyVerified: true,
    page: 1,
  });

  console.log(response.items);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
