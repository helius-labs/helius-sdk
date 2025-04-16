import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAssetProof({
    id: 'Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss',
  });

  console.log(response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
