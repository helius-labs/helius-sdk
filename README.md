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
import { Helius } from 'helius-sdk';

// Replace YOUR_API_KEY with the API key from your Helius dashboard
const helius = new Helius('YOUR_API_KEY');

const getAssetsByOwner = async () => {
  const response = await helius.rpc.getAssetsByOwner({
    ownerAddress: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
    page: 1,
  });
  console.log(response.items);
};

getAssetsByOwner();
```

[![Try it out](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/helius-node-js-sdk-xbw7t6?file=index.js)

## Handling errors

When the API returns a non-success status code (4xx or 5xx response), an error message will be thrown:

```ts
try {
  const response = await helius.rpc.getAssetsByOwner({
    ownerAddress: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
    page: 1,
  });
  console.log(response.items);
} catch (error) {
  console.log(error);
}
```

### Common Error Codes

When working with the Helius SDK, you may encounter several error codes. Below is a table detailing some of the common error codes along with additional information to help you troubleshoot:

| Error Code | Error Message         | More Information                                                                                       |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| 401        | Unauthorized          | This occurs when an invalid API key is provided or access is restricted due to RPC rules.              |
| 429        | Too Many Requests     | This indicates that the user has exceeded the request limit in a given timeframe or is out of credits. |
| 5XX        | Internal Server Error | This is a generic error message for server-side issues. Please contact Helius support for assistance.  |

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

[**Staking**](#staking)

The easiest way to stake with Helius programmatically.

- [`createStakeTransaction()`](#createstaketransaction): Generate a transaction to create + delegate a new stake account to the Helius validator.
- [`createUnstakeTransaction()`](#createunstaketransaction): Generate a transaction to deactivate a stake account.
- [`getHeliusStakeAccounts()`](#getheliusstakeaccounts): Return all stake accounts delegated to the Helius validator for a given wallet.

[**Mint API**](#mint-api)

The easiest way to mint compressed NFTs at scale.

Note, this API has been deprecated and the relevant methods will be removed in a future release. Please refer to [ZK Compression](https://docs.helius.dev/zk-compression-and-photon-api/what-is-zk-compression-on-solana) for all future compression-related work

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

[**Smart Transactions**](https://docs.helius.dev/solana-rpc-nodes/sending-transactions-on-solana#sending-smart-transactions)

- [`createSmartTransaction()`](#createSmartTransaction): Creates a smart transaction with the provided configuration
- [`getComputeUnits()`](#getComputeUnits): Simulates a transaction to get the total compute units consumed
- [`pollTransactionConfirmation()`](#pollTransactionConfirmation): Polls a transaction to check whether it has been confirmed
- [`sendSmartTransaction()`](#sendSmartTransaction): Builds and sends an optimized transaction

[**Jito Smart Transactions and Helper Methods**]()

- [`addTipInstruction()`](#addTipInstruction): Adds a tip instruction as the last instruction given the provided instructions
- [`createSmartTransactionWithTip()`](#createSmartTransactionWithTip): Creates a smart transaction with a Jito tip
- [`getBundleStatuses()`](#getBundleStatuses): Gets the status of the provided bundles
- [`sendJitoBundle()`](#sendJitoBundle): Sends a bundle of transactions to the Jito Block Engine
- [`sendSmartTransactionWithTip()`](#sendSmartTransactionWithTip): Sends a smart transaction as a Jito bundle with a tip

[**Helper methods**](#helper-methods)

Offers additional tools for various Solana-related tasks like analyzing blockchain throughput and tracking stake accounts and SPL token holders.

- [`getCurrentTPS()`](#getCurrentTPS): Returns the current transactions per second (TPS) rate — including voting transactions.
- [`airdrop()`](#airdrop): Request an allocation of lamports to the specified address
- [`getStakeAccounts()`](#getStakeAccounts): Returns all the stake accounts for a given public key.
- [`getTokenHolders()`](#getTokenHolders): Returns all the token accounts for a given mint address (ONLY FOR SPL TOKENS).
- [`getPriorityFeeEstimate()`](#getPriorityFeeEstimate): Returns an estimated priority fee based on a set of predefined priority levels (percentiles).
- [`sendTransaction()`](#sendTransaction): Wrapper for `sendTransaction` RPC call that includes support for `validatorAcls` parameter.
- [`executeJupiterSwap()`](#executeJupiterSwap): Execute a token swap using Jupiter Exchange with automatic transaction optimizations including priority fees, compute unit calculation, and reliable transaction confirmation.
