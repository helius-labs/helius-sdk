
import { Helius, WebhookType } from '../src/index';


// Testing is ad-hoc for now.
// This is an example to test your changes with your personal key. Modify as necessary.
// Execute your test with `npx ts-node tests/test.ts`
async function run() {
    const helius = new Helius("your-api-key");
    const webhook = "your-webhook-id";
    await helius.editWebhook(webhook, { webhookType: WebhookType.ENHANCED })
}

run();