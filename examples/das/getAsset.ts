import { Helius } from "../../src"; // Replace with helius-sdk in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAsset({
    id: 'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
    displayOptions: {
      showCollectionMetadata: true,
    },
  });

  const collectionNames = response.grouping?.map(
    (g: any) => g.collection_metadata?.name
  );

  console.log(collectionNames);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
