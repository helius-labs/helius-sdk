# Helius SDK

Helius SDK is the most complete & powerful SDK for building on Solana. Learn more about how Helius gives you superpowers, [here.](https://helius.xyz)

The functionality provided in this SDK nicely wraps and enhances the core Helius REST APIs, which can be found in our [API docs.](https://docs.helius.xyz)
<br />

## Getting Started

```
npm install helius-sdk
```

After installing, you can simply import the SDK:

```ts
import { Helius } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>"); // input your api key generated from dev.helius.xyz here
```

**IMPORTANT:** You must generate an API key at [dev.helius.xyz](dev.helius.xyz) and replace "\<your-api-key-here>" above with it. This will take no longer than 10 seconds as we auto-generate a key for you upon connecting your wallet.
<br />

## Using Helius SDK

Our SDK is designed to give you a seamless experience when building on Solana. We've separated the core functionality into various segments.

### **Webhooks**

Helius webhooks are the perfect way of building event driven systems on Solana.

Simply select the transaction type(s) to detect, the accounts to watch, and the webhook handler.

We've parsed over 100 transaction types (including NFT Sales, NFT Listings, and more) from over 50 different sources so you can get building ASAP.

> If you don't want Helius' unique abstractions and would rather work with Solana's native data types, set `webhookType` to "raw".

For a quick demo video, please see the [Webhook docs.](https://docs.helius.xyz/webhooks/webhooks-summary)
<br />

### **Create Webhook**

> **Note**: You can use `Types.WebhookType` to specify between raw, discord, or enhanced webhooks! The default type is "enhanced".

```ts
import { Helius, Types } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.createWebhook({
  accountAddresses: [Types.Source.MAGIC_EDEN],
  transactionTypes: [Types.TransactionType.NFT_LISTING],
  webhookURL: "my-webhook-handler.com/handle",
});
```

If you'd like to work with the native Solana transaction format instead of Helius' abstraction, use the "raw" type instead (this will also have lower latency). Note we also add an auth-header for security purposes.

```ts
import { Helius, Types } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.createWebhook({
  accountAddresses: [Types.Source.MAGIC_EDEN],
  authHeader: "some auth header",
  webhookURL: "my-webhook-handler.com/handle",
  webhookType: Types.WebhookType.RAW,
  transactionTypes: [Types.TransactionType.ANY],
});
```

For Discord webhooks, simply use `Types.WebhookType.DISCORD`.

### **Edit Webhook**

You can also edit your webhooks. A common use case is dynamically adding/removing accounts to watch in a webhook:

```ts
import { Helius, Types } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.editWebhook(
  "your-webhook-id-here",
  { accountAddresses: [Types.Source.SQUADS] } // This will ONLY update accountAddresses, not the other fields on the webhook object
);
```

> **Very important**: The `editWebhook` method will completely overwrite the existing values for the field(s) that you inputted. Make sure to fetch the existing webhook and merge the values to avoid this.

<br />
For convenience, we've added a method to let you simply append new addresses to an existing webhook:

```ts
import { Helius, Types } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.appendAddressesToWebhook("your-webhook-id-here", [
  Types.Source.SQUADS,
  Types.Source.JUPITER,
]);
```

### **Get All Webhooks**

```ts
import { Helius } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.getAllWebhooks();
```

### **Get A Single Webhook**

```ts
import { Helius } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.getWebhookByID("<webhook-id-here>");
```

### **Delete a Webhook**

```ts
import { Helius } from "helius-sdk";

const heliusAPI = new Helius("<your-api-key-here>");

heliusAPI.deleteWebhook("<webhook-id-here>"); // returns a boolean
```
