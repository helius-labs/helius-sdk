/*
    Note: You can use enum WebhookType to specify between raw, discord, or enhanced webhooks! The default type is "enhanced". 
*/

import {
    Address,
    TransactionType,
    Helius,
  } from "../../src"; // Replace with 'helius-sdk' in a production setting
  
  async function main() {
    const helius = new Helius('YOUR_API_KEY');
  
    const response = await helius.createWebhook({
      accountAddresses: [Address.MAGIC_EDEN_V2],
      transactionTypes: [TransactionType.NFT_LISTING],
      webhookURL: 'https://my-webhook-handler.com/handle',
    });
  
    console.log('Webhook created:', response);
  }
  
  main().catch((err) => {
    console.error('Example failed:', err);
    process.exit(1);
  });
  