import { Helius, Address } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhookId = 'your-webhook-id-here';

  const response = await helius.appendAddressesToWebhook(webhookId, [
    Address.SQUADS,
    Address.JUPITER_V3,
  ]);

  console.log('Updated webhook with new addresses:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
