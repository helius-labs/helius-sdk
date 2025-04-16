import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.searchAssets({
    ownerAddress: '2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha',
    compressed: true,
    page: 1,
  });

  console.log(response.items);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
