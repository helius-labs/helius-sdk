import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const ids = [
    'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
    'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
  ];

  const response = await helius.rpc.getAssetBatch({ ids });

  const assetIds = response.map((x: any) => x.id);
  console.log(assetIds);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
