import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAssetsByGroup({
    groupKey: 'collection',
    groupValue: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
    page: 1,
  });

  console.log(response.items);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
