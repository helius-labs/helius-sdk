import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhookId = '<webhook-id-here>';

  const success = await helius.deleteWebhook(webhookId);

  if (success) {
    console.log(`Webhook ${webhookId} deleted successfully.`);
  } else {
    console.log(`Failed to delete webhook ${webhookId}.`);
  }
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
