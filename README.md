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

const helius = new Helius("<your-api-key-here>"); // input your api key generated from dev.helius.xyz here
```

**IMPORTANT:** You must generate an API key at [dev.helius.xyz](dev.helius.xyz) and replace "\<your-api-key-here>" above with it. This will take no longer than 10 seconds as we auto-generate a key for you upon connecting your wallet.
<br />

## Using Helius SDK

Our SDK is designed to give you a seamless experience when building on Solana. We've separated the core functionality into various segments.

## **Webhooks**

Helius webhooks are the perfect way of building event driven systems on Solana.

Simply select the transaction type(s) to detect, the accounts to watch, and the webhook handler.

We've parsed over 100 transaction types (including NFT Sales, NFT Listings, and more) from over 50 different sources so you can get building ASAP.

> If you don't want Helius' unique abstractions and would rather work with Solana's native data types, set `webhookType` to "raw".

For a quick demo video, please see the [Webhook docs.](https://docs.helius.xyz/webhooks/webhooks-summary)
<br />

### **Create Webhook**

> **Note**: You can use enum `WebhookType` to specify between raw, discord, or enhanced webhooks! The default type is "enhanced".

```ts
import {
    // enums
    Address,
    TransactionType,
    
    // lib
    Helius,
} from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.createWebhook({
  accountAddresses: [Address.MAGIC_EDEN_V2],
  transactionTypes: [TransactionType.NFT_LISTING],
  webhookURL: "my-webhook-handler.com/handle",
});
```

If you'd like to work with the native Solana transaction format instead of Helius' abstraction, use the "raw" type instead (this will also have lower latency). Note we also add an auth-header for security purposes.

```ts
import {
  // enums
  TransactionType,
  WebhookType,
  Address,

  Helius
} from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.createWebhook({
  accountAddresses: [Address.MAGIC_EDEN_V2],
  authHeader: "some auth header",
  webhookURL: "my-webhook-handler.com/handle",
  webhookType: WebhookType.RAW,
  transactionTypes: [TransactionType.ANY],
});
```

For Discord webhooks, simply use enum `WebhookType.DISCORD`.

### **Edit Webhook**

You can also edit your webhooks. A common use case is dynamically adding/removing accounts to watch in a webhook:

```ts
import { Helius, Address } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.editWebhook(
  "your-webhook-id-here",
  { accountAddresses: [Address.SQUADS] } // This will ONLY update accountAddresses, not the other fields on the webhook object
);
```

> **Very important**: The `editWebhook` method will completely overwrite the existing values for the field(s) that you inputted. Make sure to fetch the existing webhook and merge the values to avoid this.

<br />
For convenience, we've added a method to let you simply append new addresses to an existing webhook:

```ts
import { Helius, Address } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.appendAddressesToWebhook("your-webhook-id-here", [
  Address.SQUADS,
  Address.JUPITER_V3,
]);
```

### **Get All Webhooks**

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.getAllWebhooks();
```

### **Get A Single Webhook**

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.getWebhookByID("<webhook-id-here>");
```

### **Delete a Webhook**

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.deleteWebhook("<webhook-id-here>"); // returns a boolean
```

### **Collection Webhooks!**

```ts
import {
  // collections dict
  Collections,

  Helius,
} from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

helius.createCollectionWebhook({
  collectionQuery: Collections.ABC,
  transactionTypes: [Types.TransactionType.ANY],
  webhookType: Types.WebhookType.DISCORD,
  webhookURL: "https://discord.com/api/webhooks/your-discord-token-here",
});
```

Note that the Collections.ABC enum references the collection query for this collection. It is just a convenience enum so that developers don't have to figure out whether to use firstVerifiedCreator or the Metaplex Certified Collection address ([see more about this here](https://docs.helius.xyz/api-reference/nft-collections-on-solana)). If you already know it for your collection, please make a PR :)

## NFT API

To read more about the most powerful NFT API on Solana, see [our docs](https://docs.helius.xyz/api-reference/nft-api).

### **Indexed Mintlists**

To get all the tokens for an NFT collection:

```ts
import {
  Helius
  Collections,
} from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const mints = helius.getMintlist({
  query: Collections.ABC,
});
```


## RPC Abstractions
We provide a variety of helper methods to help make Solana RPCs easier to work with.

### Solana Chain TPS
```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const tps = await helius.rpc.getCurrentTPS();
```

### Solana Airdrop
```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const response = await helius.rpc.airdrop(new PublicKey("<wallet address>"), 1000000000); // 1 sol
```

### Get Solana Stake Accounts
```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const response = await helius.rpc.getStakeAccounts("<wallet address>");
```
