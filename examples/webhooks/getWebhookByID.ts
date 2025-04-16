import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhookId = '<webhook-id-here>';

  const webhook = await helius.getWebhookByID(webhookId);

  console.log('Webhook details:', webhook);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
