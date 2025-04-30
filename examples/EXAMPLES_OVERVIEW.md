# Examples Overview
## DAS API (Digital Asset Standard)

Read more about the DAS API from our docs, [here](https://docs.helius.dev/solana-compression/digital-asset-standard-das-api).

Namespace: `helius.rpc`

### getAsset()

Get an asset by its ID.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAsset({
  id: 'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
  displayOptions: {
    showCollectionMetadata: true,
  },
});
console.log(response.grouping?.map((g) => g.collection_metadata?.name));
```

### getAssetBatch()

Get multiple assets by ID (up to 1k).

```ts
import { Helius } from 'helius-sdk';

const ids = [
  'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
  'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk',
];
const helius = new Helius('your-api-key');
const response = await helius.rpc.getAssetBatch({
  ids: ids,
});
console.log(response.map((x) => x.id));
```

### getSignaturesForAsset()

Get a list of transaction signatures related to a compressed asset.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getSignaturesForAsset({
  id: 'Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss',
  page: 1,
});
console.log(response.items);
```

### searchAssets()

Search for assets by a variety of parameters. Very useful for token-gating!

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.searchAssets({
  ownerAddress: '2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha',
  compressed: true,
  page: 1,
});
console.log(response.items);
```

### getAssetProof()

Get a merkle proof for a compressed asset by its ID.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAssetProof({
  id: 'Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss',
});
console.log(response);
```

### getAssetsByOwner()

Get a list of assets owned by an address. This is the fastest way to get all the NFTs owned by a wallet on Solana.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAssetsByOwner({
  ownerAddress: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
  page: 1,
});
console.log(response.items);
```

### getAssetsByGroup()

Get a list of assets by a group key and value. This endpoint is very useful for getting the mint list for NFT Collections.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAssetsByGroup({
  groupKey: 'collection',
  groupValue: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
  page: 1,
});
console.log(response.items);
```

### getAssetsByCreator()

Get a list of assets created by an address.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAssetsByCreator({
  creatorAddress: 'D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3',
  onlyVerified: true,
  page: 1,
});
console.log(response.items);
```

### getAssetsByAuthority()

Get a list of assets with a specific authority.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getAssetsByAuthority({
  authorityAddress: '2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW',
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
  owner: 'CckxW6C1CjsxYcXSiDbk7NYfPLhfqAm3kSB5LEZunnSE',
});

console.log(response);
```

### getNftEditions()

Get information about all the edition NFTs for a specific master NFT.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.rpc.getNftEditions({
  mint: 'Ey2Qb8kLctbchQsMnhZs5DjY32To2QtPuXNwWvk4NosL',
  page: 1,
  limit: 2,
});

console.log(response);
```

## Staking

The easiest way to manage your stake with Helius. These methods allow you to:
- Generate transactions users can sign and send themselves
- Manage staking UX flows directly on your dApp or backend
- Target the number one validator on Solana for commission-free staking

### createStakeTransaction
Create and delegate a new stake account (unsigned transaction).
```ts
const { serializedTx, stakeAccountPubkey } = await helius.rpc.createStakeTransaction(
  ownerPubkey,
  1.5 // Amount in SOL (excluding rent exemption)
);
```

### createUnstakeTransaction
Deactivate a stake account (unsigned transaction).
```ts
const serializedTx = await helius.rpc.createUnstakeTransaction(
  ownerPubkey,
  stakeAccountPubkey
);
```

### createWithdrawTransaction
Withdraw from a stake account after cooldown (unsigned transaction).
```ts
const serializedTx = await helius.rpc.createWithdrawTransaction(
  ownerPubkey,
  stakeAccountPubkey,
  destinationPubkey,
  lamportsToWithdraw
);
```

### getStakeInstructions
Return only the instructions for creating and delegating a stake account.
```ts
const { instructions, stakeAccount } = await helius.rpc.getStakeInstructions(
  ownerPubkey,
  1.5 // Amount in SOL (excluding rent exemption)
);
```

### getUnstakeInstruction
Return a single instruction to deactivate a stake account.
```ts
const ix = helius.rpc.getUnstakeInstruction(ownerPubkey, stakeAccountPubkey);
```

### getWithdrawableAmount
Returns how many lamports are withdrawable (optional rent-exempt inclusion).
```ts
const withdrawable = await helius.rpc.getWithdrawableAmount(stakeAccountPubkey, true);
```

### getWithdrawInstruction
Return a single instruction to withdraw from a stake account.
```ts
const ix = helius.rpc.getWithdrawInstruction(
  ownerPubkey,
  stakeAccountPubkey,
  destinationPubkey,
  lamportsToWithdraw
);
```

### getHeliusStakeAccounts
Fetch all stake accounts delegated to the Helius validator for a given wallet.
```ts
const heliusStakeAccounts = await helius.rpc.getHeliusStakeAccounts(walletAddress);
```

## Mint

To read more about the easiest way to mint cNFTs on Solana, see [our docs](https://docs.helius.dev/compression-and-das-api/mint-api).

Note, this API has been deprecated and the relevant methods will be removed in a future release. Please refer to [ZK Compression](https://docs.helius.dev/zk-compression-and-photon-api/what-is-zk-compression-on-solana) for all future compression-related work

### mintCompressedNft()

To mint a compressed NFT, simply call the `mintCompressedNft` method and pass in your NFT data. [This](https://xray.helius.xyz/token/UJA7Dguu6VeG3W73AyaDYQiPR9Jw9vx3XXi6CYrN224?network=mainnet) is what the mint will look like in the explorer.

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');
const response = await helius.mintCompressedNft({
  name: 'Exodia the Forbidden One',
  symbol: 'ETFO',
  owner: 'OWNER_WALLET_ADDRESS',
  description:
    'Exodia the Forbidden One is a powerful, legendary creature composed of five parts: the Right Leg, Left Leg, Right Arm, Left Arm, and the Head. When all five parts are assembled, Exodia becomes an unstoppable force.',
  attributes: [
    {
      trait_type: 'Type',
      value: 'Legendary',
    },
    {
      trait_type: 'Power',
      value: 'Infinite',
    },
    {
      trait_type: 'Element',
      value: 'Dark',
    },
    {
      trait_type: 'Rarity',
      value: 'Mythical',
    },
  ],
  imageUrl:
    'https://cdna.artstation.com/p/assets/images/images/052/118/830/large/julie-almoneda-03.jpg?1658992401',
  externalUrl: 'https://www.yugioh-card.com/en/',
  sellerFeeBasisPoints: 6900,
});
console.log(response.result);
```

### delegateCollectionAuthority() and revokeCollectionAuthority()

If you want to mint your cNFT to a collection:

- Delegate Helius as a collection authority (using `DelegateCollectionAuthority` method), so that Helius can mint to that collection on your behalf.
- Pass in the collection mint address in the `collection` field.
- (Optional) Revoke collection authority (using `RevokeCollectionAuthority` method).

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

// 1. Delegate Helius as a collection authority
await helius.delegateCollectionAuthority({
  collectionMint: 'COLLECTION_MINT_ADDRESS',
  updateAuthorityKeypair: updateAuthorityKeypair,
});

// 2. Mint your cNFT to the collection
const response = await helius.mintCompressedNft({
  name: 'Feitan Portor',
  symbol: 'FEITAN',
  owner: 'OWNER_WALLET_ADDRESS',
  collection: 'COLLECTION_MINT_ADDRESS',
  description: 'Feitan Portor is a member of the notorious Phantom Troupe.',
  attributes: [
    {
      trait_type: 'Affiliation',
      value: 'Phantom Troupe',
    },
    {
      trait_type: 'Nen Ability',
      value: 'Pain Packer',
    },
  ],
  externalUrl: 'https://hunterxhunter.fandom.com/wiki/Feitan_Portor',
  imagePath: '../images/feitan.png',
  walletPrivatekey: 'YOUR_WALLET_PRIVATE_KEY',
});

// 3. Revoke collection authority (optional)
await helius.revokeCollectionAuthority({
  collectionMint: 'COLLECTION_MINT_ADDRESS',
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
} from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.createWebhook({
  accountAddresses: [Address.MAGIC_EDEN_V2],
  transactionTypes: [TransactionType.NFT_LISTING],
  webhookURL: 'my-webhook-handler.com/handle',
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
} from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.createWebhook({
  accountAddresses: [Address.MAGIC_EDEN_V2],
  authHeader: 'some auth header',
  webhookURL: 'my-webhook-handler.com/handle',
  webhookType: WebhookType.RAW,
  transactionTypes: [TransactionType.ANY],
});
```

For Discord webhooks, simply use enum `WebhookType.DISCORD`.

### editWebhook()

You can also edit your webhooks. A common use case is dynamically adding/removing accounts to watch in a webhook:

```ts
import { Helius, Address } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.editWebhook(
  'your-webhook-id-here',
  { accountAddresses: [Address.SQUADS] } // This will ONLY update accountAddresses, not the other fields on the webhook object
);
```

> **Very important**: The `editWebhook` method will completely overwrite the existing values for the field(s) that you inputted. Make sure to fetch the existing webhook and merge the values to avoid this.

### appendAddressesToWebhook()

For convenience, we've added a method to let you simply append new addresses to an existing webhook:

```ts
import { Helius, Address } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.appendAddressesToWebhook('your-webhook-id-here', [
  Address.SQUADS,
  Address.JUPITER_V3,
]);
```

### removeAddressesFromWebhook()

For convenience, we've added a method to let you simply remove addresses from an existing webhook:

```ts
import { Helius, Address } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.removeAddressesFromWebhook('your-webhook-id-here', [
  Address.SQUADS,
  Address.JUPITER_V3,
]);
```

### deleteWebhook()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.deleteWebhook('<webhook-id-here>'); // returns a boolean
```

### getWebhookByID()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.getWebhookByID('<webhook-id-here>');
```

### getAllWebhooks()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.getAllWebhooks();
```

### createCollectionWebhook()

```ts
import {
  // collections dict
  Collections,
  Helius,
} from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

helius.createCollectionWebhook({
  collectionQuery: Collections.ABC,
  transactionTypes: [Types.TransactionType.ANY],
  webhookType: Types.WebhookType.DISCORD,
  webhookURL: 'https://discord.com/api/webhooks/your-discord-token-here',
});
```

Note that the Collections.ABC enum references the collection query for this collection. It is just a convenience enum so that developers don't have to figure out whether to use firstVerifiedCreator or the Metaplex Certified Collection address. If you already know it for your collection, please make a PR.

## Smart Transactions

### createSmartTransaction()

The smart transaction creation functionality has been abstracted out of `sendSmartTransaction` and is available with the `createSmartTransaction()` method. It takes in an array of instructions, signers, lookup tables, and an optional fee payer. It returns an object containing the smart transaction (i.e., `Transaction | VersionedTransaction`) as well as the `lastValidBlockHeight`:

```ts
const { smartTransaction: transaction, lastValidBlockHeight } =
  await helius.rpc.createSmartTransaction(
    instructions,
    signers,
    lookupTables,
    feePayer
  );
```

### getComputeUnits()

This method simulates a transaction to get the total compute units consumed. It takes in an array of instructions, a fee payer, an array of lookup tables, and an array of signers. It returns the compute units consumed, or null if unsuccessful:

```ts
const units = helius.rpc.getComputeUnits(instructions, payerKey, [], []);
```

### pollTransactionConfirmation()

This method polls a transaction to check whether it has been confirmed. It takes in a `TransactionSignature` and checks whether it has been confirmed within the timeout period. Currently, this method defaults to a 15 second timeout and a 5 second retry interval, so it polls 3 times over 15 seconds. However, with `PollTransactionOptions`, these values can be changed in addition to the confirmation status. It returns the confirmed transaction signature or an error if the confirmation times out:

```ts
let txSig = await helius
  .connection()
  .sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
    ...sendOptions,
  });

return await helius.rpc.pollTransactionConfirmation(txSig);
```

### sendSmartTransaction()

This method builds and sends an optimized transaction, while handling its confirmation status. Whether the transaction skips preflight checks and how many times it is retried is configurable by the user.

**Arguments:**

- `instructions: TransactionInstruction[]` - Array of instructions to be executed in the transaction
- `signers: Signer[]` - Array of signers for the transaction. The first signer is used as the fee payer unless specified otherwise
- `lookupTables: AddressLookupTableAccount[]` - (Optional) Array of lookup tables for versioned transactions. Defaults to `[]`
- `options: SendSmartTransactionOptions` - (Optional) Configuration options:
  - `lastValidBlockHeightOffset` (number, optional, default=150): Offset added to current block height to compute expiration. Must be positive.
  - `pollTimeoutMs` (number, optional, default=60000): Total timeout (ms) for confirmation polling.
  - `pollIntervalMs` (number, optional, default=2000): Interval (ms) between polling attempts.
  - `pollChunkMs` (number, optional, default=10000): Timeout (ms) for each individual polling chunk.
  - `skipPreflight` (boolean, optional, default=false): Skip preflight transaction checks if true.
  - `preflightCommitment` (Commitment, optional, default='confirmed'): Commitment level for preflight checks.
  - `maxRetries` (number, optional): Maximum number of retries for sending the transaction.
  - `minContextSlot` (number, optional): Minimum slot at which to fetch blockhash (prevents stale blockhash usage).
  - `feePayer` (Signer, optional): Override fee payer (defaults to first signer).
  - `priorityFeeCap` (number, optional): Maximum priority fee to pay in microlamports (for fee estimation capping).
  - `serializeOptions` (SerializeConfig, optional): Custom serialization options for the transaction.

The following code snippet is an example of sending 0.5 SOL to a given public key, with an optimized transaction that skips preflight checks:

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

## Jito Smart Transactions and Helper Methods

### addTipInstruction()

This method adds a tip instruction to the last instruction in the set of provided instructions. It is a transfer instruction that sends the specified amount of lamports from the fee payer to the designated tip account.

```ts
const randomTipAccount =
  JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];
const tipAmount = 10000;

helius.rpc.addTipInstruction(
  instructions,
  feePayer,
  randomTipAccount,
  tipAmount
);
```

### createSmartTransactionWithTip()

Similarly to `createSmartTransaction`, the smart transaction creation functionality for smart transactions with tips has been abstracted out of `sendSmartTransactionWithTip` and is available with the `createSmartTransactionWithTip` method. It takes in an array of instructions, signers, lookup tables, as well as a tip amount and an optional fee payer. The tip amount defaults to 1000 lamports — the minimum specified in [Jito's documentation](https://jito-labs.gitbook.io/mev/searcher-resources/bundles#tip-guidelines). It returns the serialized transaction as a string, and the `lastValidBlockHeight`. The reason we return the transaction as a string is because the `sendJitoBundle` method requires a serialzied transaction:

```ts
const { serializedTransaction, lastValidBlockHeight } =
  await this.createSmartTransactionWithTip(
    instructions,
    signers,
    lookupTables,
    tipAmount,
    feePayer
  );
```

### getBundleStatuses()

This method gets the status of Jito bundles. It takes in an array of bundle IDs and a Jito Block Engine API URL. It returns the status of the bundles.

```ts
const bundleIds = [
  /* Bundle IDs */
];
const jitoApiUrl = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';
const statuses = helius.rpc.getBundleStatuses(bundleIds, jitoApiUrl);
```

### sendJitoBundle()

This method sends a bundle of transactions to the Jito Block Engine. It takes in an array of serialized transactions and a Jito Block Engine API URL. It returns the bundle ID as a string.

```ts
const jitoApiUrl = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';
const bundleId = helius.rpc.sendJitoBundle(
  [serializedTransactions],
  jitoApiUrl
);
```

### sendSmartTransactionWithTip()

This method has the same functionality as `sendSmartTransaction`. However, it sends the optimized transaction as a bundle and includes a tip so it is processed by Jito's Block Engine. The following code snippet sends 0.05 SOL to a given public key with a Jito tip of 100k lamports using Jito's New York API URL:

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
const toPubkey = /* The person we're sending 0.05 SOL to */;

const instructions: TransactionInstruction[] = [
  SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: toPubkey,
    lamports: 0.05 * LAMPORTS_PER_SOL,
  }),
];

// Call the sendSmartTransactionWithTip function
const bundleId = await helius.rpc.sendSmartTransactionWithTip(instructions, [keypair], address_lut, 100000, "NY");
console.log(`Bundle sent successfully with ID: ${bundleId}`);
```

## Helper methods

We provide a variety of helper methods to help make Solana RPCs easier to work with.

### getCurrentTPS()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

const tps = await helius.rpc.getCurrentTPS();
```

### airdrop()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

const response = await helius.rpc.airdrop(
  new PublicKey('<wallet address>'),
  1000000000
); // 1 sol
```

### getStakeAccounts()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

const response = await helius.rpc.getStakeAccounts('<wallet address>');
```

### getTokenHolders()

```ts
import { Helius } from 'helius-sdk';

const helius = new Helius('YOUR_API_KEY');

const response = await helius.rpc.getTokenHolders('<token mint address>');
```

### getPriorityFeeEstimate()

This method considers both global and local fee markets in the estimation. Users can also specify to receive all the priority levels and adjust the window with which these levels are calculated via `lookbackSlots`

```ts
import { Helius } from 'helius-sdk';
const helius = new Helius('YOUR_API_KEY');

const response = await helius.rpc.getPriorityFeeEstimate({
  accountKeys: ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'],
  options: {
    includeAllPriorityFeeLevels: true,
  },
});

console.log(response);
```

### sendTransaction()

This method behaves the same way as the standard `sendTransaction`, but adds support for `validatorAcls` JSON-based allow/denylists.

```ts
try {
  const response = await helius.rpc.sendTransaction(transaction, {
    validatorAcls: [SFDP_REJECTS_URL],
    skipPreflight: true,
  });
} catch (error) {
  console.error(error);
}
```

### broadcastTransaction()
This method broadcasts a fully signed transaction and polls for its confirmation, regardless of whether it's an object or serialized. If
a `Transaction` is passed in then we automatically extract the `recentBlockhash`. In the example below, we build a versioned transaction,
serialize it to a buffer, and then broadcast the transaction.

```typescript
async function main() {
    // Build a versioned transaction
    const { blockhash } = await helius.connection.getLatestBlockhash();
  
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient,
          lamports: 1000,
        }),
      ],
    }).compileToV0Message();
  
    const vtx = new VersionedTransaction(messageV0);
  vtx.sign([payer]);

  // Serialize to Buffer
  const serializedBuffer = Buffer.from(vtx.serialize());

  // Broadcast
  const signature = await helius.rpc.broadcastTransaction(serializedBuffer);
  console.log('Broadcast serialized (Buffer) signature:', signature);
  }
```

### executeJupiterSwap()

Execute a token swap using Jupiter Exchange with automatic transaction optimizations including priority fees, compute unit calculation, and reliable transaction confirmation.

```typescript
import { Helius } from 'helius-sdk';
import { Keypair } from '@solana/web3.js';

const helius = new Helius('YOUR_API_KEY');

// Swap SOL to USDC with transaction landing optimizations
const result = await helius.rpc.executeJupiterSwap({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 10000000, // 0.01 SOL (SOL has 9 decimals)
  slippageBps: 50, // 0.5% slippage tolerance
  restrictIntermediateTokens: true, // Improves pricing
  priorityLevel: 'high', // Options: 'low', 'medium', 'high', 'very_high'
  maxPriorityFeeLamports: 1000000, // Caps priority fee at 0.001 SOL
  skipPreflight: true, // Skip preflight checks
  confirmationCommitment: 'confirmed' // Wait for confirmation
}, wallet);

if (result.success && result.confirmed) {
  console.log(`Received ${result.outputAmount} USDC, tx: ${result.signature}`);
}
```

Key features:
- Automatic compute unit and priority fee calculation
- Transaction retry logic during network congestion
- Slippage tolerance and route optimization
- Transaction confirmation tracking
- Returns detailed swap information including output amounts, minimums, and explorer URLs

## helius.connection

> [!WARNING]  
> This uses Solana-Web3.js version 1.73.2

Incorporates all commonly-used methods from Solana-Web3.js Provider using your Helius RPC. Ideal for managing connections and performing standard Solana blockchain operations. For a list of all the Methods see: https://docs.solana.com/api/http

```ts
import { Helius } from 'helius-sdk';

// Replace YOUR_API_KEY with the API key from your Helius dashboard
const helius = new Helius('YOUR_API_KEY');

const getBlockHeight = async () => {
  const response = await helius.connection.getBlockHeight();
  console.log(response);
};

getBlockHeight();
```

## FAQ

Q: I get an error stating `Cannot use import statement outside a module`  
A: In the `package.json` file add `"type": "module"`. Adding this enables ES6 modules.
