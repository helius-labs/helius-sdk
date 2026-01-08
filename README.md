# Helius Node.js SDK

[![Version](https://img.shields.io/npm/v/helius-sdk)](https://www.npmjs.org/package/helius-sdk)
![Downloads](https://img.shields.io/npm/dm/helius-sdk)

The Helius Node.js SDK provides access to Helius-related methods and APIs using TypeScript, making building on Solana as easy as possible.

## Documentation

API reference documentation is available at [helius.dev/docs](https://www.helius.dev/docs).

## Contributions

Interested in contributing? Read the following [contributions guide](https://github.com/helius-labs/helius-sdk/blob/main/CONTRIBUTING.md) before opening a PR.

## Installation

Using pnpm (recommended):

```shell
pnpm add helius-sdk
```

Using npm:

```shell
npm install helius-sdk
```

Using yarn:

```shell
yarn add helius-sdk
```

## Usage

The package needs to be configured with your account's API key, which is available in the [Helius Dashboard](https://dashboard.helius.dev/).

```ts
import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getAssetsByOwner({
      ownerAddress: "owner_address_goes_here",
      page: 1,
      limit: 50,
      sortBy: { sortBy: "created", sortDirection: "asc" },
    });

    console.log("Fetched assets:", assets);
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

### Migrating to `helius-sdk` 2.0.0
The Helius Node.js SDK has been rewritten from the ground up in version 2.0.0 to use [`@solana/kit` (i.e., Kit)](https://www.npmjs.com/package/@solana/kit) under the hood, replacing the dependency on `@solana/web3.js` versions higher than 1.73.2.

We've gone to great lengths to ensure that the developer experience remains largely the same, with minimal impact on existing code. The API methods and namespaces are designed to be intuitive and an improvement on previous versions, so migrating to the latest version is relatively straightforward. There are a plethora of examples found in the `examples` directory, organized by namespace, to aid in this migration.

For more detailed migration help, refer to the following [migration guide](https://github.com/helius-labs/helius-sdk/blob/main/MIGRATION.md)

For general help with Kit, please refer to [Kit's new documentation site](https://www.solanakit.com/)

## Handling errors

When the API returns a non-success status code (4xx or 5xx response), an error message will be thrown:

```ts
try {
  const assets = await helius.getAssetsByOwner({
    ownerAddress: "owner_address_goes_here",
    page: 1,
    limit: 50,
    sortBy: { sortBy: "created", sortDirection: "asc" },
  });

  console.log("Fetched assets:", assets);
} catch (error) {
  console.error("Error:", error);
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

Our SDK is designed to give you a seamless experience when building on Solana. We've separated the core functionality into various segments. Examples for individual methods can be found in the `examples` directory, with examples organized by namespace.

[**DAS API**](https://www.helius.dev/docs/das-api)

Comprehensive and performant API for tokens, NFTs, and compressed NFTs on Solana. Available on the `helius` namespace.

- [`getAsset()`](https://www.helius.dev/docs/api-reference/das/getasset): Get an asset by its ID.
- [`getAssetBatch()`](https://www.helius.dev/docs/api-reference/das/getassetbatch): Get multiple assets by their IDs (up to 1k).
- [`getAssetProof()`](https://www.helius.dev/docs/api-reference/das/getassetproof): Get a Merkle proof for a compressed asset by its ID.
- [`getAssetProofBatch()`](https://www.helius.dev/docs/api-reference/das/getassetproofbatch): Get Merkle proofs for a set of compressed assets by their IDs.
- [`getAssetsByAuthority()`](https://www.helius.dev/docs/api-reference/das/getassetsbyauthority): Get a list of assets with a specific authority.
- [`getAssetsByCreator()`](https://www.helius.dev/docs/api-reference/das/getassetsbycreator): Get a list of assets created by an address.
- [`getAssetsByGroup()`](https://www.helius.dev/docs/api-reference/das/getassetsbygroup): Get a list of assets by a group key and value. This endpoint is very useful for getting the mint list for NFT Collections.
- [`getAssetsByOwner()`](https://www.helius.dev/docs/api-reference/das/getassetsbyowner): Get a list of assets owned by an address. This is the fastest way to get all the NFTs and fungible tokens that are owned by a wallet on Solana.
- [`getNftEditions()`](https://www.helius.dev/docs/api-reference/das/getnfteditions): Get information about all the edition NFTs for a specific master NFT.
- [`getTokenAccounts()`](https://www.helius.dev/docs/api-reference/das/gettokenaccounts): Get information about all token accounts for a specific mint or a specific owner.
- [`searchAssets()`](https://www.helius.dev/docs/api-reference/das/searchassets): Search for assets by a variety of parameters. This is very useful for token-gating.

**RPC V2 Methods**

Enhanced RPC methods, available only with Helius.

- [`getProgramAccountsV2()`](https://www.helius.dev/docs/api-reference/rpc/http/getprogramaccountsv2): Enhanced version of `getProgramAccounts` with cursor-based pagination and `changedSinceSlot` support for efficiently querying large sets of accounts owned by specific Solana programs with incremental updates.
- `getAllProgramAccounts()`: Auto-paginates through all program accounts. Use with caution on larger programs.
- [`getTokenAccountsByOwnerV2()`](https://www.helius.dev/docs/api-reference/rpc/http/gettokenaccountsbyownerv2): An enhanced version of `getTokenAccountsByOwner` with cursor-based pagination and `changedSinceSlot` support to incrementally retrieve SPL token accounts owned by a given mint.
- `getAllTokenAccountsByOwner()`: Auto-paginates all token accounts for a given owner.
- [`getTransactionsForAddress()`](https://www.helius.dev/docs/rpc/gettransactionsforaddress): Get transaction history for an address with advanced filtering by slot, time, and bidirectional sorting options. Supports both signature-only and full transaction details. Optionally include transactions from associated token accounts. 

[**Staking**](https://www.helius.dev/docs/staking/how-to-stake-with-helius-programmatically)

The easiest way to stake with Helius programmatically. Available on the `helius.staking` namespace.

- `createStakeTransaction()`: Generate a transaction to create + delegate a new stake account to the Helius validator.
- `createUnstakeTransaction()`: Generate a transaction to deactivate a stake account.
- `createWithdrawTransaction()`: Generate a transaction to withdraw lamports from a stake account (after cooldown).
- `getStakeInstructions()`: Return only the instructions for creating and delegating a stake account.
- `getUnstakeInstruction()`: Return the instruction to deactivate a stake account.
- `getWithdrawInstruction()`: Return the instruction to withdraw lamports from a stake account.
- `getWithdrawableAmount()`: Determine how many lamports are withdrawable (with optional rent-exempt inclusion).
- `getHeliusStakeAccounts()`: Return all stake accounts delegated to the Helius validator for a given wallet.

[**Transactions**](https://docs.helius.dev/solana-rpc-nodes/sending-transactions-on-solana#sending-smart-transactions)

Simply create, send, and land transactions as fast as possible. Available on the `helius.tx` namespace.

- `getComputeUnits()`: Fetches the total compute units the transaction provided is expected to consume
- `broadcastTransaction()`: Broadcasts a fully signed transaction (object or serialized) and polls for its confirmation.
- `pollTransactionConfirmation()`: Polls a transaction to check whether it has been confirmed
- `createSmartTransaction()`: Creates a smart transaction with the provided configuration
- `sendSmartTransaction()`: Builds and sends an optimized transaction
- `sendTransaction()`: Wrapper for [`sendTransaction` RPC call](https://www.helius.dev/docs/api-reference/rpc/http/sendtransaction) that includes support for a `validatorAcls` parameter (i.e., JSON-based allow and deny lists).
- `sendTransactionWithSender()`: Ultra-low latency Solana transaction submission with dual routing to validators and Jito infra via [Helius Sender](https://www.helius.dev/docs/sending-transactions/sender).

[**Priority Fee API**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#helper-methods)

Estimate optimal priority fees for Solana transactions. Available on the `helius` namespace.

- [`getPriorityFeeEstimate()`](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#getpriorityfeeestimate): Returns an estimated priority fee based on a set of predefined priority levels (percentiles).

[**Enhanced Transactions API**](https://www.helius.dev/docs/enhanced-transactions)

Transform complex Solana transactions into human-readable data. Available on the `helius.enhanced` namespace.

- [`getTransactions()`](https://www.helius.dev/docs/api-reference/enhanced-transactions/gettransactions): Converts raw Solana transactions into enhanced, human-readable formats with decoded instruction data and contextual information.
- [`getTransactionsByAddress()`](https://www.helius.dev/docs/api-reference/enhanced-transactions/gettransactionsbyaddress): Retrieves a comprehensive transaction history for a given address with human-readable decoded data.

[**Webhooks**](https://www.helius.dev/docs/webhooks)

Provides methods for setting up, editing, and managing webhooks, crucial for listening to on-chain Solana events (e.g., sales, listings, swaps) and triggering actions when these events happen. Available on the `helius.webhooks` namespace.

- [`createWebhook()`](https://www.helius.dev/docs/api-reference/webhooks/create-webhook): Creates a new webhook with the provided request.
- [`getWebhookByID()`](https://www.helius.dev/docs/api-reference/webhooks/get-webhook): Retrieves a single webhook by its ID.
- [`getAllWebhooks()`](https://www.helius.dev/docs/api-reference/webhooks/get-all-webhooks): Retrieves a list of all webhooks.
- [`updateWebhook()`](https://www.helius.dev/docs/api-reference/webhooks/update-webhook): Edits an existing webhook by its ID with the provided request.
- [`deleteWebhook()`](https://www.helius.dev/docs/api-reference/webhooks/delete-webhook): Deletes a webhook by its ID.

[**WebSockets**](https://www.helius.dev/docs/rpc/websocket)

Stream real-time data with WebSockets using Kit's subscription methods. Available on the `helius.ws` namespace.

- [`logsNotifications()`](https://www.helius.dev/docs/api-reference/rpc/websocket/logssubscribe): Streams transaction logs for all transactions, all transactions including votes, or transactions that mention a specific set of addresses.
- [`slotNotifications()`](https://www.helius.dev/docs/api-reference/rpc/websocket/slotsubscribe): Streams notifications any time a slot is processed by a validator.
- [`signatureNotifications()`](https://www.helius.dev/docs/api-reference/rpc/websocket/signaturesubscribe): Streams notifications when a transaction with the provided signature reaches the specified commitment level.
- [`programNotifications()`](https://www.helius.dev/docs/api-reference/rpc/websocket/programsubscribe): Streams notifications when the lamports or data for an account owned by the specified program changes.
- [`accountNotifications()`](https://www.helius.dev/docs/api-reference/rpc/websocket/accountsubscribe): Streams notifications when the lamports or data for the specified account changes.
- `close()`: Closes an open WebSocket connection via Kit's `dispose` method, falling back to `.close()`.

[**ZK Compression**](https://github.com/helius-labs/helius-sdk/blob/main/examples/EXAMPLES_OVERVIEW.md#helper-methods)

Estimate optimal priority fees for Solana transactions. Available on the `helius.zk` namespace.

- [`getSignaturesForAsset()`](https://www.helius.dev/docs/api-reference/das/getsignaturesforasset): Retrieves a complete chronological history of all transactions involving the provided compressed NFT (cNFT).
- [`getCompressedAccount()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedaccount): Returns the compressed account for the address or hash provided.
- [`getCompressedAccountProof()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedaccountproof): Returns a proof the compression program uses to verify that the given account is valid.
- [`getCompressedAccountsByOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedaccountsbyowner): Returns the owner’s compressed accounts.
- [`getCompressedBalance()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedbalance): Returns the balance for the compressed account with the given address or hash.
- [`getCompressedBalanceByOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedbalancebyowner): Returns the total balance of the owner’s compressed accounts.
- [`getCompressedMintTokenHolders()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedminttokenholders): Returns the owner balances for a given mint in descending order.
- [`getCompressedTokenAccountBalance()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedtokenaccountbalance): Returns the balance for a given token account.
- [`getCompressedTokenAccountsByDelegate()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedtokenaccountsbydelegate): Returns the compressed token accounts that are partially or fully delegated to the given delegate.
- [`getCompressedTokenAccountsByOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedtokenaccountsbyowner): Returns the compressed token accounts owned by a certain account.
- [`getCompressedTokenBalancesByOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedtokenbalancesbyowner): Returns the token balances for a given owner.
- [`getCompressedTokenBalancesByOwnerV2()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressedtokenbalancesbyownerv2): Returns the token balances for a given owner. The V2 version solves a minor naming issue.
- [`getCompressionSignaturesForAccount()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressionsignaturesforaccount): Return the signatures of the transactions that closed or opened a compressed account with the given hash.
- [`getCompressionSignaturesForAddress()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressionsignaturesforaddress): Return the signatures of the transactions that closed or opened a compressed account with the given address.
- [`getCompressionSignaturesForOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressionsignaturesforowner): Returns the signatures of the transactions that have modified an owner’s compressed accounts.
- [`getCompressionSignaturesForTokenOwner()`](https://www.helius.dev/docs/api-reference/zk-compression/getcompressionsignaturesfortokenowner): Returns the signatures of the transactions that have modified an owner’s compressed token accounts.
- [`getIndexerHealth()`](https://www.helius.dev/docs/api-reference/zk-compression/getindexerhealth): Returns an error if the indexer is stale by more than a configurable number of blocks. Otherwise, it returns `ok`.
- [`getIndexerSlot()`](https://www.helius.dev/docs/api-reference/zk-compression/getindexerslot): Returns the slot of the last block indexed by the indexer.
- [`getLatestCompressionSignatures()`](https://www.helius.dev/docs/api-reference/zk-compression/getlatestcompressionsignatures): Returns the signatures of the latest transactions that used the compression program.
- [`getLatestNonVotingSignatures()`](https://www.helius.dev/docs/api-reference/zk-compression/getlatestnonvotingsignatures): Returns the signatures of the latest transactions that are not voting transactions.
- [`getMultipleCompressedAccountProofs()`](https://www.helius.dev/docs/api-reference/zk-compression/getmultiplecompressedaccountproofs): Returns multiple proofs used by the compression program to verify the accounts’ validity.
- [`getMultipleCompressedAccounts()`](https://www.helius.dev/docs/api-reference/zk-compression/getmultiplecompressedaccounts): Returns multiple compressed accounts with the given addresses or hashes.
- [`getMultipleNewAddressProofs()`](https://www.helius.dev/docs/api-reference/zk-compression/getmultiplenewaddressproofs): Returns proofs that the new addresses are not taken already and can be created.
- [`getMultipleNewAddressProofsV2()`](https://www.helius.dev/docs/api-reference/zk-compression/getmultiplenewaddressProofsv2): Returns proofs that the new addresses are not taken already and can be created.
- [`getTransactionWithCompressionInfo()`](https://www.helius.dev/docs/api-reference/zk-compression/gettransactionwithcompressioninfo): Returns the transaction data for the transaction with the given signature along with parsed compression info.
- [`getValidityProof()`](https://www.helius.dev/docs/api-reference/zk-compression/getvalidityproof): Returns a single ZK Proof used by the compression program to verify that the given accounts are valid and that the new addresses can be created.
