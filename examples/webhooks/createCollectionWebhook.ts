import {
    Collections,
    Helius,
    TransactionType,
    WebhookType
  } from "../../src"; // Replace with 'helius-sdk' in a production setting
  
  async function main() {
    const helius = new Helius('YOUR_API_KEY');
  
    const response = await helius.createCollectionWebhook({
        collectionQuery: Collections.ABC,
        transactionTypes: [TransactionType.ANY],
        webhookType: WebhookType.DISCORD,
        webhookURL: 'https://discord.com/api/webhooks/your-discord-token-here',
        accountAddresses: []
    });
  
    console.log('Collection webhook created:', response);
  }
  
  main().catch((err) => {
    console.error('Example failed:', err);
    process.exit(1);
  });
  