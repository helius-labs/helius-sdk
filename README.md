# Helius Node.js SDK

[![Version](https://img.shields.io/npm/v/helius-sdk)](https://www.npmjs.org/package/helius-sdk)
![Downloads](https://img.shields.io/npm/dm/helius-sdk)

The Helius Node.js library provides access to the Helius API from JavaScript/TypeScript.

## Documentation

API reference documentation is available at [docs.helius.dev](https://docs.helius.dev).

## Installation

Using npm:

```shell
npm install helius-sdk
```

Using yarn:

```shell
yarn add helius-sdk
```

## Usage

The package needs to be configured with your account's API key, which is available in the [Helius Dashboard](https://dev.helius.xyz/dashboard/app). 
```js 
import { Helius } from "helius-sdk";

// Replace YOUR_API_KEY with the API key from your Helius dashboard
const helius = new Helius("YOUR_API_KEY"); 

const getAssetsByOwner = async () => {
  const response = await helius.rpc.getAssetsByOwner({
    ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
    page: 1,
  });
  console.log(response.items);
}

getAssetsByOwner();
```

[![Try it out](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/helius-node-js-sdk?file=index.js&view=editor)

## Handling errors

When the API returns a non-success status code (4xx or 5xx response), an error message will be thrown:

```ts
try {
  const response = await helius.rpc.getAssetsByOwner({
    ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
    page: 1,
  });
  console.log(response.items);
} catch (error) {
  console.log(error);
}
```

### Common Error Codes

When working with the Helius SDK, you may encounter several error codes. Below is a table detailing some of the common error codes along with additional information to help you troubleshoot:

| Error Code | Error Message             | More Information                                                                           |
|------------|---------------------------|---------------------------------------------------------------------------------------------|
| 401        | Unauthorized              | This occurs when an invalid API key is provided or access is restricted due to RPC rules.   |
| 429        | Too Many Requests         | This indicates that the user has exceeded the request limit in a given timeframe or is out of credits. |
| 5XX        | Internal Server Error     | This is a generic error message for server-side issues. Please contact Helius support for assistance. |

If you encounter any of these errors, refer to the Helius documentation for further guidance, or reach out to the Helius support team for more detailed assistance.

## Using the Helius SDK

Our SDK is designed to give you a seamless experience when building on Solana. We've separated the core functionality into various segments.

[**DAS API**](#das-api-digital-asset-standard)

Comprehensive and performant API for tokens, NFTs, and compressed NFTs on Solana.

  - [`getAsset()`](#getAsset): Get an asset by its ID.
  - [`getAssetBatch()`](#getAssetBatch): Get multiple assets by ID (up to 1k).
  - [`getSignaturesForAsset()`](#getSignaturesForAsset): Get a list of transaction signatures related to a compressed asset.
  - [`searchAssets()`](#searchAssets): Search for assets by a variety of parameters. Very useful for token-gating!
  - [`getAssetProof()`](#getAssetProof): Get a Merkle proof for a compressed asset by its ID.
  - [`getAssetsByOwner()`](#getAssetsByOwner): Get a list of assets owned by an address. This is the fastest way to get all the NFTs and fungible tokens that are owned by a wallet on Solana.
  - [`getAssetsByGroup()`](#getAssetsByGroup): Get a list of assets by a group key and value. This endpoint is very useful for getting the mint list for NFT Collections.
  - [`getAssetsByCreator()`](#getAssetsByCreator): Get a list of assets created by an address.
  - [`getAssetsByAuthority()`](#getAssetsByAuthority): Get a list of assets with a specific authority.
  - [`getTokenAccounts()`](#getTokenAccounts): Get information about all token accounts for a specific mint or a specific owner.
  - [`getNftEditions()`](#getNftEditions): Get information about all the edition NFTs for a specific master NFT

[**Mint API**](#mint-api)

The easiest way to mint compressed NFTs at scale.

- [`mintCompressedNft()`](#mintCompressedNft): Mint a new compressed NFT. 
- [`delegateCollectionAuthority()`](#delegatecollectionauthority-and-revokecollectionauthority): Delegates collection authority to a new address.
- [`revokeCollectionAuthority()`](#delegatecollectionauthority-and-revokecollectionauthority): Revokes collection authority from an address.
- [`getMintlist()`](#getMintlist) Get all the tokens for an NFT collection.

[**Webhooks**](#webhooks)

Provides methods for setting up, editing, and managing webhooks, crucial for listening to on-chain Solana events (e.g., sales, listings, swaps) and triggering actions when these events happen.

- [`createWebhook()`](#createWebhook): Creates a new webhook with the provided request.
- [`editWebhook()`](#editWebhook): Edits an existing webhook by its ID with the provided request.
- [`appendAddressesToWebhook()`](#appendAddressesToWebhook): Append new addresses to an existing webhook.
- [`removeAddressesFromWebhook()`](#removeAddressesFromWebhook): Remove addresses from an existing webhook.
- [`deleteWebhook()`](#deleteWebhook): Deletes a webhook by its ID.
- [`getWebhookByID()`](#getWebhookByID): Retrieves a single webhook by its ID.
- [`getAllWebhooks()`](#getAllWebhooks): Retrieves a list of all webhooks.
- [`createCollectionWebhook()`](#createCollectionWebhook) Create a new collection webhook with the provided request.

[**Helper methods**](#helper-methods)

Offers additional tools for various Solana-related tasks like analyzing blockchain throughput and tracking stake accounts and SPL token holders.

- [`getCurrentTPS()`](#getCurrentTPS): Returns the current transactions per second (TPS) rate — including voting transactions.
- [`airdrop()`](#airdrop): Request an allocation of lamports to the specified address
- [`getStakeAccounts()`](#getStakeAccounts): Returns all the stake accounts for a given public key.
- [`getTokenHolders()`](#getTokenHolders): Returns all the token accounts for a given mint address (ONLY FOR SPL TOKENS).
- [`getPriorityFeeEstimate()`](#getPriorityFeeEstimate): Returns an estimated priority fee based on a set of predefined priority levels (percentiles).
- [`sendSmartTransaction()`](#sendSmartTransaction): Builds and sends an optimized transaction

## DAS API (Digital Asset Standard)

Read more about the DAS API from our docs, [here](https://docs.helius.dev/solana-compression/digital-asset-standard-das-api).

Namespace: `helius.rpc`

### getAsset()

Get an asset by its ID.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAsset({
  id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
  displayOptions: {
    showCollectionMetadata: true,
  },
});
console.log(response.grouping?.map((g) => g.collection_metadata?.name));
```

### getAssetBatch()

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

### getSignaturesForAsset()

Get a list of transaction signatures related to a compressed asset.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getSignaturesForAsset({
  id: "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss",
  page: 1,
});
console.log(response.items);
```

### searchAssets()

Search for assets by a variety of parameters. Very useful for token-gating!

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.searchAssets({
  ownerAddress: "2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha",
  compressed: true,
  page: 1,
});
console.log(response.items);
```

### getAssetProof()

Get a merkle proof for a compressed asset by its ID.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAssetProof({
  id: "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss",
});
console.log(response);
```

### getAssetsByOwner()

Get a list of assets owned by an address. This is the fastest way to get all the NFTs owned by a wallet on Solana.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAssetsByOwner({
  ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
  page: 1,
});
console.log(response.items);
```

### getAssetsByGroup()

Get a list of assets by a group key and value. This endpoint is very useful for getting the mint list for NFT Collections.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAssetsByGroup({
  groupKey: "collection",
  groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
  page: 1,
});
console.log(response.items);
```

### getAssetsByCreator()

Get a list of assets created by an address.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAssetsByCreator({
  creatorAddress: "D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3",
  onlyVerified: true,
  page: 1,
});
console.log(response.items);
```

### getAssetsByAuthority()

Get a list of assets with a specific authority.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getAssetsByAuthority({
  authorityAddress: "2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW",
  page: 1,
});
console.log(response.items);
```

### getTokenAccounts()

Get information about all token accounts for a specific mint or a specific owner.

```ts
const response = await helius.rpc.getTokenAccounts({
  page: 1,
  limit: 100,
  options: {
    showZeroBalance: false,
  },
  owner: "CckxW6C1CjsxYcXSiDbk7NYfPLhfqAm3kSB5LEZunnSE"
});

console.log(response);
```

### getNftEditions()

Get information about all the edition NFTs for a specific master NFT.

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
const response = await helius.rpc.getNftEditions({
  mint: "Ey2Qb8kLctbchQsMnhZs5DjY32To2QtPuXNwWvk4NosL",
  page: 1,
  limit: 2,
});

console.log(response);
```

## Mint

To read more about the easiest way to mint cNFTs on Solana, see [our docs](https://docs.helius.dev/compression-and-das-api/mint-api).

### mintCompressedNft()

To mint a compressed NFT, simply call the `mintCompressedNft` method and pass in your NFT data. [This](https://xray.helius.xyz/token/UJA7Dguu6VeG3W73AyaDYQiPR9Jw9vx3XXi6CYrN224?network=mainnet) is what the mint will look like in the explorer.


```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");
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

const helius = new Helius("YOUR_API_KEY");
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

### delegateCollectionAuthority() and revokeCollectionAuthority()

If you want to mint your cNFT to a collection:

- Delegate Helius as a collection authority (using `DelegateCollectionAuthority` method), so that Helius can mint to that collection on your behalf.
- Pass in the collection mint address in the `collection` field.
- (Optional) Revoke collection authority (using `RevokeCollectionAuthority` method).

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

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
### getMintlist()

To get all the tokens for an NFT collection:

```ts
import {
  Helius
  Collections,
} from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

const mints = helius.getMintlist({
  query: Collections.ABC,
});
```

## **Webhooks**

Helius webhooks are the perfect way of building event-driven systems on Solana.

Simply select the transaction type(s) to detect, the accounts to watch, and the webhook handler.

We've parsed over 100 transaction types (including NFT Sales, NFT Listings, and more) from over 50 different sources so you can get building ASAP.

> If you don't want Helius' unique abstractions and would rather work with Solana's native data types, set `webhookType` to "raw".

For a quick demo video, please see the [Webhook docs.](https://docs.helius.dev/webhooks/webhooks-summary)

### createWebhook()

> **Note**: You can use enum `WebhookType` to specify between raw, discord, or enhanced webhooks! The default type is "enhanced".

```ts
import {
  // enums
  Address,
  TransactionType,

  // lib
  Helius,
} from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

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

const helius = new Helius("YOUR_API_KEY");

helius.createWebhook({
  accountAddresses: [Address.MAGIC_EDEN_V2],
  authHeader: "some auth header",
  webhookURL: "my-webhook-handler.com/handle",
  webhookType: WebhookType.RAW,
  transactionTypes: [TransactionType.ANY],
});
```

For Discord webhooks, simply use enum `WebhookType.DISCORD`.

### editWebhook()

You can also edit your webhooks. A common use case is dynamically adding/removing accounts to watch in a webhook:

```ts
import { Helius, Address } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.editWebhook(
  "your-webhook-id-here",
  { accountAddresses: [Address.SQUADS] } // This will ONLY update accountAddresses, not the other fields on the webhook object
);
```

> **Very important**: The `editWebhook` method will completely overwrite the existing values for the field(s) that you inputted. Make sure to fetch the existing webhook and merge the values to avoid this.

### appendAddressesToWebhook()

For convenience, we've added a method to let you simply append new addresses to an existing webhook:

```ts
import { Helius, Address } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.appendAddressesToWebhook("your-webhook-id-here", [
  Address.SQUADS,
  Address.JUPITER_V3,
]);
```

### removeAddressesFromWebhook()

For convenience, we've added a method to let you simply remove addresses from an existing webhook:

```ts
import { Helius, Address } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.removeAddressesFromWebhook("your-webhook-id-here", [
  Address.SQUADS,
  Address.JUPITER_V3,
]);
```

### getAllWebhooks()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.getAllWebhooks();
```

### getWebhookByID()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.getWebhookByID("<webhook-id-here>");
```

### deleteWebhook()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.deleteWebhook("<webhook-id-here>"); // returns a boolean
```

### createCollectionWebhook()

```ts
import {
  // collections dict
  Collections,
  Helius,
} from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

helius.createCollectionWebhook({
  collectionQuery: Collections.ABC,
  transactionTypes: [Types.TransactionType.ANY],
  webhookType: Types.WebhookType.DISCORD,
  webhookURL: "https://discord.com/api/webhooks/your-discord-token-here",
});
```

Note that the Collections.ABC enum references the collection query for this collection. It is just a convenience enum so that developers don't have to figure out whether to use firstVerifiedCreator or the Metaplex Certified Collection address. If you already know it for your collection, please make a PR.

## Helper methods

We provide a variety of helper methods to help make Solana RPCs easier to work with.

### getCurrentTPS()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

const tps = await helius.rpc.getCurrentTPS();
```

### airdrop()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

const response = await helius.rpc.airdrop(
  new PublicKey("<wallet address>"),
  1000000000
); // 1 sol
```

### getStakeAccounts()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

const response = await helius.rpc.getStakeAccounts("<wallet address>");
```

### getTokenHolders()

```ts
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

const response = await helius.rpc.getTokenHolders("<token mint address>");
```

### getPriorityFeeEstimate()
This method considers both global and local fee markets in the estimation. Users can also specify to receive all the priority levels and adjust the window with which these levels are calculated via `lookbackSlots`

```ts
import { Helius } from "helius-sdk";
const helius = new Helius("YOUR_API_KEY");

const response = await helius.rpc.getPriorityFeeEstimate({
  accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
  options: {
    includeAllPriorityFeeLevels: true,
  }
});

console.log(response);
```

### sendSmartTransaction()
This method builds and sends an optimized transaction, while handling its confirmation status. Whether the transaction skips preflight checks and how many times it is retried is configurable by the user. The following code snippet is an example of sending 0.5 SOL to a given public key, with an optimize transaction that skips preflight checks and retries twice, if necessary

```ts
import { Helius } from "helius-sdk";
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";

const helius = new Helius("YOUR_API_KEY");

const fromKeypair = /* Your keypair goes here */;
const fromPubkey = fromKeypair.publicKey;
const toPubkey = /* The person we're sending 0.5 SOL to */;

const instructions: TransactionInstruction[] = [
  SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: toPubkey,
    lamports: 0.5 * LAMPORTS_PER_SOL, 
  }),
];

const transactionSignature = await helius.rpc.sendSmartTransaction(instructions, [fromKeypair], [], { skipPreflight: true });
console.log(`Successful transfer: ${transactionSignature}`);
```

### createSmartTransaction()
The smart transaction creation functionality has been abstracted out of `sendSmartTransaction` and is available with the `createSmartTransaction()` method. It can be called using the exact same parameters as `sendSmartTransaction` and will return either an optimized `Transaction` or `VersionedTransaction`:
```ts
const transaction = await this.createSmartTransaction(instructions, signers, lookupTables, sendOptions);
```

## helius.connection

> [!WARNING]   
> This uses Solana-Web3.js version 1.73.2

Incorporates all commonly-used methods from Solana-Web3.js Provider using your Helius RPC. Ideal for managing connections and performing standard Solana blockchain operations. For a list of all the Methods see: https://docs.solana.com/api/http

```ts
import { Helius } from "helius-sdk";

// Replace YOUR_API_KEY with the API key from your Helius dashboard
const helius = new Helius("YOUR_API_KEY"); 

const getBlockHeight = async () => {
  const response = await helius.connection.getBlockHeight();
  console.log(response);
}

getBlockHeight();
```

## FAQ

Q: I get an error stating `Cannot use import statement outside a module`  
A: In the `package.json` file add `"type": "module"`. Adding this enables ES6 modules.