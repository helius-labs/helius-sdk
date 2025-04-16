import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAssetsByAuthority({
    authorityAddress: '2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW',
    page: 1,
  });

  console.log(response.items);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
