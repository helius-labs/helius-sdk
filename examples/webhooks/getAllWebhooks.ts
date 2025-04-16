import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const webhooks = await helius.getAllWebhooks();

  console.log('Registered webhooks:', webhooks);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
