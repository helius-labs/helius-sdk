import { Helius, Address } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhookId = 'your-webhook-id-here';

  const response = await helius.editWebhook(webhookId, {
    accountAddresses: [Address.SQUADS],
  });

  console.log('Webhook updated:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
