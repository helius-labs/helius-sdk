
import { EnhancedWebhookResponse, Helius, RawWebhookRespone, WebhookType } from '../src/index';
const express = require('express')
const app = express()
const port = 3000
let data: any;
// ENHANCED EXAMPLE
async function sendEnhancedWebhookRequest(data: any): Promise<EnhancedWebhookResponse> {
    const response = await fetch('', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    return response.json();
  }
  // RAW EXAMPLE
  async function sendRawWebhookRequest(data: any): Promise<RawWebhookRespone> {
    const response = await fetch('', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    return response.json();
  }
  async function processWebhookResponse() {
    try {
      const response: EnhancedWebhookResponse = await sendEnhancedWebhookRequest(data);
      console.log(response.accountData);
      console.log(response.description);
      console.log(response.fee);
    } catch (error) {
      console.error('Error occurred:', error);
    }

    const rawResponse: RawWebhookRespone = await sendRawWebhookRequest(data);
    console.log(rawResponse.blockTime)
    console.log(rawResponse.indexWithinBlock)
    console.log(rawResponse.meta.err)
    console.log(rawResponse.meta.innerInstructions)
  }
  processWebhookResponse()