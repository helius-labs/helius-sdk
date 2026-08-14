# Helius TypeScript SDK

[![Version](https://img.shields.io/npm/v/helius-sdk)](https://www.npmjs.org/package/helius-sdk)
![Downloads](https://img.shields.io/npm/dm/helius-sdk)

The Helius TypeScript SDK provides access to Helius APIs and enhanced Solana RPC functionality, making building on Solana as easy as possible.

### Agent Account Sign Up

The SDK ships two signup helpers on `helius.auth`:

- `signup(opts)` — authenticates the wallet, detects existing projects, and returns either `kind: "already_subscribed"`, `kind: "upgrade_required"`, or `kind: "payment_required"` with a hosted-checkout link the user opens in a browser.
- `signupAndPay(opts)` — same as `signup`, plus auto-pays USDC + memo from the local keypair and polls activation. On poll timeout returns `kind: "pending"` with the `txSignature` so callers can resume later.

```ts
import { makeAuthClient } from "helius-sdk/auth/client";

const auth = makeAuthClient();
const { secretKey } = await auth.generateKeypair();

const result = await auth.signup({
  secretKey,
  plan: "agent",
  email: "you@example.com",
  firstName: "Jane",
  lastName: "Doe",
});

if (result.kind === "payment_required") {
  console.log("Pay here:", result.paymentLink.paymentUrl);
}
```

See [`examples/auth/signup.ts`](./examples/auth/signup.ts) and [`examples/auth/signupAndPay.ts`](./examples/auth/signupAndPay.ts) for full flows.

> **For AI Agents:** You can create a Helius account and generate an API key programmatically using the helius-cli. See the [agent signup guide](https://www.helius.dev/docs/api-reference/helius-cli.md) or [helius-cli agent file](https://dashboard.helius.dev/agents.md) for complete details.

## Documentation

API reference documentation is available at [helius.dev/docs](https://www.helius.dev/docs).

For detailed SDK API docs (auto-generated from source), see the [TypeDoc Reference](https://helius-labs.github.io/helius-sdk/).

See the [CHANGELOG](https://github.com/helius-labs/helius-sdk/blob/main/CHANGELOG.md) for version history and release notes.

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

### Larger transactions with version 1

Agave 4.2 raises the maximum transaction size from 1,232 to 4,096 bytes ([SIMD-0296](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0296-larger-transactions.md)). That size is only available in the version 1 transaction format ([SIMD-0385](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0385-transaction-v1.md)). Legacy and v0 transactions are unaffected and remain the default.

Opt in by passing `version: 1`:

```typescript
const smart = await helius.tx.createSmartTransaction({
  signers: [feePayerSigner],
  instructions: [transferIx],
  version: 1,
});
```

Version 1 moves the compute-unit limit and priority fee out of `ComputeBudgetProgram` instructions and into the transaction header, so a v1 transaction is *smaller* on the wire than the v0 equivalent even before you use the extra room. The SDK handles this for you — do not pass compute-budget instructions yourself, as they are no-ops on v1 that still consume bytes and compute units.

Because v1 pays a **total** priority fee in lamports rather than a per-compute-unit rate, the result reports both:

```typescript
smart.priorityFee;         // microLamports per CU, the rate the SDK settled on
smart.priorityFeeLamports; // total lamports the transaction pays
```

You can budget against either. `priorityFeeCap` caps the per-CU rate; `priorityFeeLamportsCap` caps the absolute spend:

```typescript
const smart = await helius.tx.createSmartTransaction({
  signers: [feePayerSigner],
  instructions: [transferIx],
  version: 1,
  priorityFeeLamportsCap: 50_000, // Never spend more than 50k lamports on priority
});
```

#### Version 1 constraints

Version 1 **does not support address lookup tables**. Every account must be listed inline, and the SDK throws if an instruction sources an account from a lookup table. Use version 0 if you depend on them.

The format also caps a transaction at 64 instructions, 64 unique addresses, 12 signatures, and 255 accounts per instruction. At 4,096 bytes the full address list usually fits inline anyway.

The SDK checks the size limit before requesting any signature, so an oversized transaction fails locally rather than on submission.

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
- [`getTransfersByAddress()`](https://www.helius.dev/docs/rpc/gettransfersbyaddress): Get parsed token and native SOL transfer history for an address with filters by mint, time, amount, counterparty, direction, and cursor pagination.

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
- `sendTransactionWithSender()`: Ultra-low latency Solana transaction submission via [Helius Sender](https://www.helius.dev/docs/sending-transactions/sender). Routes across multiple high-speed pathways and enters a priority auction; tip more to land first. Two tiers: **Sender Max** (`swqosOnly: false`, 0.001 SOL minimum tip) and **SWQOS-only** (`swqosOnly: true`, 0.000005 SOL minimum tip).
- `sendBundleWithSender()`: Submits an ordered bundle of pre-signed transactions (max 5) atomically over Sender Max via the `sendBundle` method, then tracks landing per-signature with `getSignatureStatuses`. At least one transaction in the bundle must carry the 0.001 SOL Sender Max minimum tip.

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

[**Enhanced WebSockets**](https://www.helius.dev/docs/websockets) (Business+ plan)

Real-time filtered streaming that's 1.5-2x faster than standard WebSockets. Supports up to 50,000 address filters. Available on the `helius.ws` namespace.

- `transactionSubscribe(filter, config)`: Subscribe to real-time transaction notifications with advanced filtering (accounts, vote/failed status, signatures). Returns an `AsyncIterable` with an `unsubscribe()` method.
- `transactionUnsubscribe(subscriptionId)`: Unsubscribe from a transaction subscription.
- `accountSubscribe(account, config)`: Subscribe to real-time account change notifications via Enhanced WebSockets.
- `accountUnsubscribe(subscriptionId)`: Unsubscribe from an enhanced account subscription.

```typescript
const sub = await helius.ws.transactionSubscribe(
  { accountInclude: ["EPjF..."] },
  { commitment: "confirmed", encoding: "jsonParsed" }
);
for await (const notif of sub) {
  console.log(notif.signature, notif.slot);
}
await sub.unsubscribe();
```

[**Pre Confirmations**](https://www.helius.dev/docs/sending-transactions/sender) (`preconfSubscribe`)

Helius's lowest-latency transaction stream: scheduled transactions are delivered over WebSocket **before** they are shredded. A pre-confirmation is an **early signal, not a guarantee** — a streamed transaction may still fail to land. Coverage is **not continuous**: it scales with the share of stake forwarding scheduled transactions to Helius, so expect gaps. Pricing is credit-based (10 credits per notification message), the same model as other Helius WebSocket subscriptions. Use the standalone `makePreconfWsClient` (or `makePreconfWsClientForApiKey`) from `helius-sdk/websockets/preconfWs`.

- `preconfSubscribe()`: Subscribe to Pre Confirmations. Takes **no filter parameters** — streams *all* scheduled transactions. Returns an `AsyncIterable` of `{ version, slot, transactionIndex, status, transaction, transactionBytes }` with an `unsubscribe()` method.
- `preconfUnsubscribe(subscriptionId)`: Unsubscribe.

Notifications are **binary** frames (the subscribe ack is a JSON text frame); the little-endian layout is `version:u8 | slot:u64_le | transaction_index:u64_le | status:u8 | bincode(VersionedTransaction)`. The `version` byte is checked first (currently `1`; unknown versions throw and are dropped) and `status` is the `PreconfStatus` enum (`Failed = 0`, `Success = 1`, `Unknown = 2`).

```typescript
import { makePreconfWsClientForApiKey } from "helius-sdk/websockets/preconfWs";

const client = makePreconfWsClientForApiKey(apiKey);
const sub = await client.preconfSubscribe();
for await (const event of sub) {
  // event.transaction is the decoded @solana/kit Transaction; event.transactionBytes is the raw bincode payload
  console.log(event.version, event.slot, event.transactionIndex, event.status);
}
await sub.unsubscribe();
client.close();
```

> **Note:** The Pre Confirmations stream is served from the Gatekeeper endpoint (`wss://beta.helius-rpc.com/?api-key=<KEY>`). Despite the `beta` host name this is the production path.

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

[**Wallet API**](https://www.helius.dev/docs/wallet-api) **(Beta)**

Query wallet data including identity, balances, history, and transfers. Available on the `helius.wallet` namespace.

- [`getIdentity()`](https://www.helius.dev/docs/api-reference/wallet-api/identity): Get wallet identity for known addresses (e.g., exchanges, protocols)
- [`getBatchIdentity()`](https://www.helius.dev/docs/api-reference/wallet-api/identity): Batch identity lookup for up to 100 addresses
- [`getBalances()`](https://www.helius.dev/docs/api-reference/wallet-api/balances): Get all token and NFT balances with USD values and pagination
- [`getBalanceAt()`](https://www.helius.dev/docs/api-reference/wallet-api/balance-at): Get a wallet's balance of a specific token or native SOL at a past timestamp, datetime, or slot
- [`getHistory()`](https://www.helius.dev/docs/api-reference/wallet-api/history): Fetch transaction history with balance changes and pagination
- [`getTransfers()`](https://www.helius.dev/docs/api-reference/wallet-api/transfers): Get all token transfer activity with sender/recipient information
- [`getFundedBy()`](https://www.helius.dev/docs/api-reference/wallet-api/funded-by): Discover the original funding source for a wallet

[**Admin API**](https://www.helius.dev/docs/admin-api)

Query project-level administrative data that is authenticated with an API key and served from `https://admin-api.helius.xyz/v0`. Available on the `helius.admin` namespace.

Admin API access is feature-gated per project. The API key must belong to the same project as the `projectId` you request.

- [`getProjectUsage(projectId)`](https://www.helius.dev/docs/api-reference/admin-api/project-usage): Get current billing-period credit usage, remaining credits, prepaid credits, and per-product usage breakdown for a project.

Examples:

- [`examples/admin/getProjectUsage.ts`](https://github.com/helius-labs/helius-sdk/blob/main/examples/admin/getProjectUsage.ts): Use the root SDK client via `createHelius({ apiKey })`
- [`examples/admin/makeAdminClient.ts`](https://github.com/helius-labs/helius-sdk/blob/main/examples/admin/makeAdminClient.ts): Use the direct admin client import via `helius-sdk/admin/client`
