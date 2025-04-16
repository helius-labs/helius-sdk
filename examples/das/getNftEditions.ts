import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getNftEditions({
    mint: 'Ey2Qb8kLctbchQsMnhZs5DjY32To2QtPuXNwWvk4NosL',
    page: 1,
    limit: 2,
  });

  console.log(response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
