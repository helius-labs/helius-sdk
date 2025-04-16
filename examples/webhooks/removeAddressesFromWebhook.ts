import { Helius, Address } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhookId = 'your-webhook-id-here';

  const response = await helius.removeAddressesFromWebhook(webhookId, [
    Address.SQUADS,
    Address.JUPITER_V3,
  ]);

  console.log('Removed addresses from webhook:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
