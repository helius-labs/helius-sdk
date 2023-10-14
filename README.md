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
  Helius,
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

## DAS API

Read more about the DAS API from our docs, [here](https://docs.helius.xyz/solana-compression/digital-asset-standard-das-api).

### **getAsset**

Get an asset by its ID.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAsset({
  id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
  displayOptions: {
    showCollectionMetadata: true,
  },
});
console.log(response.grouping?.map((g) => g.collection_metadata?.name));
```

### getAssetBatch

Get multiple assets by ID (up to 1k).

```ts
import { Helius } from "helius-sdk";

const ids = [
  "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
  "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
];
const helius = new Helius("your-api-key");
const response = await helius.rpc.getAssetBatch({
  ids: ids,
});
console.log(response.map((x) => x.id));
```

### **getSignaturesForAsset**

Get a list of transaction signatures related to a compressed asset.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getSignaturesForAsset({
  id: "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss",
  page: 1,
});
console.log(response.items);
```

### searchAssets

Search for assets by a variety of parameters. Very useful for token-gating!

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.searchAssets({
  ownerAddress: "2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha",
  compressed: true,
  page: 1,
});
console.log(response.items);
```

### **getAssetProof**

Get a merkle proof for a compressed asset by its ID.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAssetProof({
  id: "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss",
});
console.log(response);
```

### **getAssetsByOwner**

Get a list of assets owned by an address. This is the fastest way to get all the NFTs owned by a wallet on Solana.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAssetsByOwner({
  ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
  page: 1,
});
console.log(response.items);
```

### **getAssetsByGroup**

Get a list of assets by a group key and value. This endpoint is very useful for getting the mintlist for NFT Collections.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAssetsByGroup({
  groupKey: "collection",
  groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
  page: 1,
});
console.log(response.items);
```

### **getAssetsByCreator**

Get a list of assets created by an address.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAssetsByCreator({
  creatorAddress: "D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3",
  onlyVerified: true,
  page: 1,
});
console.log(response.items);
```

### **getAssetsByAuthority**

Get a list of assets with a specific authority.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.rpc.getAssetsByAuthority({
  authorityAddress: "2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW",
  page: 1,
});
console.log(response.items);
```

## Mint API

To read more about the easiest way to mint cNFTs on Solana, see [our docs](https://docs.helius.dev/compression-and-das-api/mint-api).

To mint a compressed NFT, simply call the `mintCompressedNft` method and pass in your NFT data. [This](https://xray.helius.xyz/token/UJA7Dguu6VeG3W73AyaDYQiPR9Jw9vx3XXi6CYrN224?network=mainnet) is what the mint will look like in the explorer.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.mintCompressedNft({
  name: "Exodia the Forbidden One",
  symbol: "ETFO",
  owner: "OWNER_WALLET_ADDRESS",
  description:
    "Exodia the Forbidden One is a powerful, legendary creature composed of five parts: the Right Leg, Left Leg, Right Arm, Left Arm, and the Head. When all five parts are assembled, Exodia becomes an unstoppable force.",
  attributes: [
    {
      trait_type: "Type",
      value: "Legendary",
    },
    {
      trait_type: "Power",
      value: "Infinite",
    },
    {
      trait_type: "Element",
      value: "Dark",
    },
    {
      trait_type: "Rarity",
      value: "Mythical",
    },
  ],
  imageUrl:
    "https://cdna.artstation.com/p/assets/images/images/052/118/830/large/julie-almoneda-03.jpg?1658992401",
  externalUrl: "https://www.yugioh-card.com/en/",
  sellerFeeBasisPoints: 6900,
});
console.log(response.result);
```

If you want the SDK to handle the image upload, you can do so by passing in the `imagePath` and `walletPrivatekey` fields. `imagePath` is the relative path to the image, and `walletPrivatekey` is the private key of the wallet that'll pay for the image upload to Arweave.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");
const response = await helius.mintCompressedNft({
  name: "Aggron",
  symbol: "AGNFT",
  owner: "OWNER_WALLET_ADDRESS",
  description:
    "Aggron is a powerful Steel/Rock-type Pokémon known for its iron defense.",
  attributes: [
    {
      trait_type: "Type",
      value: "Steel/Rock",
    },
    {
      trait_type: "Power",
      value: "High",
    },
  ],
  externalUrl: "https://www.pokemon.com/us/pokedex/aggron",
  imagePath: "../images/aagron.png",
  walletPrivatekey: "YOUR_WALLET_PRIVATE_KEY",
});
```

If you want to mint your cNFT to a collection:

- Delegate Helius as a collection authority (using `DelegateCollectionAuthority` method), so that Helius can mint to that collection on your behalf.
- Pass in the collection mint address in the `collection` field.
- (Optional) Revoke collection authority (using `RevokeCollectionAuthority` method).

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("HELIUS_API_KEY");

// 1. Delegate Helius as a collection authority
await helius.delegateCollectionAuthority({
  collectionMint: "COLLECTION_MINT_ADDRESS",
  updateAuthorityKeypair: updateAuthorityKeypair,
});

// 2. Mint your cNFT to the collection
const response = await helius.mintCompressedNft({
  name: "Feitan Portor",
  symbol: "FEITAN",
  owner: "OWNER_WALLET_ADDRESS",
  collection: "COLLECTION_MINT_ADDRESS",
  description: "Feitan Portor is a member of the notorious Phantom Troupe.",
  attributes: [
    {
      trait_type: "Affiliation",
      value: "Phantom Troupe",
    },
    {
      trait_type: "Nen Ability",
      value: "Pain Packer",
    },
  ],
  externalUrl: "https://hunterxhunter.fandom.com/wiki/Feitan_Portor",
  imagePath: "../images/feitan.png",
  walletPrivatekey: "YOUR_WALLET_PRIVATE_KEY",
});

// 3. Revoke collection authority (optional)
await helius.revokeCollectionAuthority({
  collectionMint: "COLLECTION_MINT_ADDRESS",
  revokeAuthorityKeypair: revokeAuthorityKeypair,
});
```

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

const response = await helius.rpc.airdrop(
  new PublicKey("<wallet address>"),
  1000000000
); // 1 sol
```

### Get Solana Stake Accounts

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const response = await helius.rpc.getStakeAccounts("<wallet address>");
```

### Get Holders for SPL Tokens

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("<your-api-key-here>");

const response = await helius.rpc.getTokenHolders("<token mint address>");
```
