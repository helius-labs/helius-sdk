# Helius Node.js SDK

[![Version](https://img.shields.io/npm/v/helius-sdk)](https://www.npmjs.org/package/helius-sdk)
![Downloads](https://img.shields.io/npm/dm/helius-sdk)

The Helius Node.js library provides access to the Helius API from JavaScript/TypeScript.

## Documentation

API reference documentation is available at [docs.helius.dev](https://docs.helius.dev).

## Contributions

Interested in contributing? Read the following [contributions guide...](https://github.com/helius-labs/helius-sdk/blob/main/CONTRIBUTING.md).

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

[**DAS API**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#das-api-digital-asset-standard)

Comprehensive and performant API for tokens, NFTs, and compressed NFTs on Solana.

- [`getAsset()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getasset): Get an asset by its ID.
- [`getAssetBatch()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetbatch): Get multiple assets by ID (up to 1k).
- [`getSignaturesForAsset()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getsignaturesforasset): Get a list of transaction signatures related to a compressed asset.
- [`searchAssets()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#searchassets): Search for assets by a variety of parameters. Very useful for token-gating!
- [`getAssetProof()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetproof): Get a Merkle proof for a compressed asset by its ID.
- [`getAssetsByOwner()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetsbyowner): Get a list of assets owned by an address. This is the fastest way to get all the NFTs and fungible tokens that are owned by a wallet on Solana.
- [`getAssetsByGroup()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetsbygroup): Get a list of assets by a group key and value. This endpoint is very useful for getting the mint list for NFT Collections.
- [`getAssetsByCreator()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetsbycreator): Get a list of assets created by an address.
- [`getAssetsByAuthority()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getassetsbyauthority): Get a list of assets with a specific authority.
- [`getTokenAccounts()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#gettokenaccounts): Get information about all token accounts for a specific mint or a specific owner.
- [`getNftEditions()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getnfteditions): Get information about all the edition NFTs for a specific master NFT

[**Staking**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#staking)

The easiest way to stake with Helius programmatically.

- [`createStakeTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createstaketransaction): Generate a transaction to create + delegate a new stake account to the Helius validator.
- [`createUnstakeTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createunstaketransaction): Generate a transaction to deactivate a stake account.
- [`createWithdrawTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createwithdrawtransaction): Generate a transaction to withdraw lamports from a stake account (after cooldown).
- [`getStakeInstructions()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getstakeinstructions): Return only the instructions for creating and delegating a stake account.
- [`getUnstakeInstruction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getunstakeinstruction): Return the instruction to deactivate a stake account.
- [`getWithdrawInstruction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getwithdrawinstruction): Return the instruction to withdraw lamports from a stake account.
- [`getWithdrawableAmount()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getwithdrawableamount): Determine how many lamports are withdrawable (with optional rent-exempt inclusion).
- [`getHeliusStakeAccounts()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getheliusstakeaccounts): Return all stake accounts delegated to the Helius validator for a given wallet.

[**Mint API**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#mint)

The easiest way to mint compressed NFTs at scale.

Note, this API has been deprecated and the relevant methods will be removed in a future release. Please refer to [ZK Compression](https://docs.helius.dev/zk-compression-and-photon-api/what-is-zk-compression-on-solana) for all future compression-related work

- [`mintCompressedNft()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#mintcompressednft): Mint a new compressed NFT.
- [`delegateCollectionAuthority()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#delegatecollectionauthority-and-revokecollectionauthority): Delegates collection authority to a new address.
- [`revokeCollectionAuthority()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#delegatecollectionauthority-and-revokecollectionauthority): Revokes collection authority from an address.
- [`getMintlist()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getmintlist) Get all the tokens for an NFT collection.

[**Webhooks**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#webhooks)

Provides methods for setting up, editing, and managing webhooks, crucial for listening to on-chain Solana events (e.g., sales, listings, swaps) and triggering actions when these events happen.

- [`createWebhook()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createwebhook): Creates a new webhook with the provided request.
- [`editWebhook()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#editwebhook): Edits an existing webhook by its ID with the provided request.
- [`appendAddressesToWebhook()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#appendaddressestowebhook): Append new addresses to an existing webhook.
- [`removeAddressesFromWebhook()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#removeaddressesfromwebhook): Remove addresses from an existing webhook.
- [`deleteWebhook()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#deletewebhook): Deletes a webhook by its ID.
- [`getWebhookByID()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getwebhookbyid): Retrieves a single webhook by its ID.
- [`getAllWebhooks()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getallwebhooks): Retrieves a list of all webhooks.


[**Smart Transactions**](https://docs.helius.dev/solana-rpc-nodes/sending-transactions-on-solana#sending-smart-transactions)

- [`createSmartTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createsmarttransaction): Creates a smart transaction with the provided configuration
- [`getComputeUnits()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getcomputeunits): Simulates a transaction to get the total compute units consumed
- [`pollTransactionConfirmation()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#polltransactionconfirmation): Polls a transaction to check whether it has been confirmed
- [`sendSmartTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#sendsmarttransaction): Builds and sends an optimized transaction

[**Jito Smart Transactions and Helper Methods**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#jito-smart-transactions-and-helper-methods)

- [`addTipInstruction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#addtipinstruction): Adds a tip instruction as the last instruction given the provided instructions
- [`createSmartTransactionWithTip()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#createsmarttransactionwithtip): Creates a smart transaction with a Jito tip
- [`getBundleStatuses()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getbundlestatuses): Gets the status of the provided bundles
- [`sendJitoBundle()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#sendjitobundle): Sends a bundle of transactions to the Jito Block Engine
- [`sendSmartTransactionWithTip()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#sendsmarttransactionwithtip): Sends a smart transaction as a Jito bundle with a tip

[**Enhanced RPC Methods (V2)**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#enhanced-rpc-methods-v2)

New paginated RPC methods with cursor-based pagination for efficient data retrieval.

- [`getProgramAccountsV2()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/rpc/getProgramAccountsV2.ts): Get program accounts with pagination support and changedSinceSlot for incremental updates.
- [`getAllProgramAccounts()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/rpc/getProgramAccountsV2.ts): Auto-paginate through all program accounts (use with caution for large programs).
- [`getTokenAccountsByOwnerV2()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/rpc/getTokenAccountsByOwnerV2.ts): Get token accounts by owner with pagination and filters.
- [`getAllTokenAccountsByOwner()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/rpc/getTokenAccountsByOwnerV2.ts): Auto-paginate through all token accounts for an owner.

[**Helper Methods**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#helper-methods)

Offers additional tools for various Solana-related tasks like analyzing blockchain throughput and tracking stake accounts and SPL token holders.

- [`getCurrentTPS()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getcurrenttps): Returns the current transactions per second (TPS) rate — including voting transactions.
- [`airdrop()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#airdrop): Request an allocation of lamports to the specified address
- [`getStakeAccounts()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getstakeaccounts): Returns all the stake accounts for a given public key.
- [`getTokenHolders()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#gettokenholders): Returns all the token accounts for a given mint address (ONLY FOR SPL TOKENS).
- [`getPriorityFeeEstimate()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getpriorityfeeestimate): Returns an estimated priority fee based on a set of predefined priority levels (percentiles).
- [`sendTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#sendtransaction): Wrapper for `sendTransaction` RPC call that includes support for `validatorAcls` parameter.
- [`broadcastTransaction()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#broadcasttransaction): Broadcasts a fully signed transaction (object or serialized) and polls for its confirmation.
- [`executeJupiterSwap()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#executejupiterswap): Execute a token swap using Jupiter Exchange with automatic transaction optimizations including priority fees, compute unit calculation, and reliable transaction confirmation.
