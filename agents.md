# Helius TypeScript SDK

Machine-readable guide for AI agents using the Helius TypeScript SDK to build on Solana.

- Package: `helius-sdk` (npm/pnpm/yarn)
- Version: 2.x (uses @solana/kit, not @solana/web3.js)
- Runtime: Node.js 20+, browsers, Deno
- TypeScript: 5.8+
- License: ISC

## Getting an API Key

Get an API key from https://dashboard.helius.dev, or sign up programmatically via the Helius CLI. See the [CLI agent guide](https://dashboard.helius.dev/agents.md) for automated signup instructions.

## Quick Start

```typescript
import { createHelius } from "helius-sdk";

const helius = createHelius({
  apiKey: "your-api-key",
  network: "mainnet", // or "devnet"
});

// Get all NFTs owned by a wallet
const assets = await helius.getAssetsByOwner({
  ownerAddress: "wallet_address",
  page: 1,
  limit: 50,
});

// Get transaction history (with token account activity)
const txs = await helius.getTransactionsForAddress([
  "wallet_address",
  { limit: 100, transactionDetails: "full", filters: { tokenAccounts: "balanceChanged" } },
]);

// Send a transaction via Helius Sender (ultra-low latency)
const sig = await helius.tx.sendTransactionWithSender({
  instructions: [transferInstruction],
  signers: [walletSigner],
  region: "US_EAST",  // Default, US_SLC, US_EAST, EU_WEST, EU_CENTRAL, EU_NORTH, AP_SINGAPORE, AP_TOKYO
});
```

## Client Options

```typescript
const helius = createHelius({
  apiKey: "your-api-key",       // Required for webhooks, enhanced txs, wallet API
  network: "mainnet",           // "mainnet" (default) or "devnet"
  baseUrl: "https://custom..",  // Override RPC URL (optional)
  rebateAddress: "wallet",      // Wallet for RPC rebates (optional)
  userAgent: "my-agent/1.0",   // Custom User-Agent (optional)
});
```

### Namespaces

| Namespace | Access | Purpose |
|-----------|--------|---------|
| DAS API | `helius.getAsset()`, `helius.getAssetsByOwner()`, etc. | Query NFTs, tokens, compressed assets |
| RPC V2 | `helius.getTransactionsForAddress()`, `helius.getProgramAccountsV2()` | Enhanced RPC with pagination & filters |
| Transactions | `helius.tx.*` | Smart transactions & Helius Sender |
| Enhanced | `helius.enhanced.*` | Parse transactions into human-readable format |
| Webhooks | `helius.webhooks.*` | Create/manage webhook subscriptions |
| WebSockets | `helius.ws.*` | Real-time blockchain data streams |
| Staking | `helius.stake.*` | Stake SOL to Helius validator |
| ZK Compression | `helius.zk.*` | Compressed accounts & proofs |
| Wallet API | `helius.wallet.*` | Balances, history, identity lookups |
| Standard RPC | `helius.getBalance()`, `helius.getSlot()`, etc. | All standard Solana RPC methods via proxy |
| Raw RPC | `helius.raw` | Direct access to the underlying @solana/kit `Rpc` client (see below) |
| Auth | `import { makeAuthClient } from "helius-sdk/auth/client"` | Agent signup, keypair gen, project/API key management (standalone import) |

### `helius.raw` — Direct @solana/kit RPC Access

Standard Solana RPC methods are available directly on `helius.*` via a Proxy (e.g., `helius.getBalance(addr).send()`). The `helius.raw` property exposes the same underlying `Rpc` client explicitly, which is useful when you need to pass the client to @solana/kit helpers or third-party libraries that expect a standard `Rpc` object.

```typescript
// Via proxy (convenient)
const balance = await helius.getBalance(address).send();

// Via raw (explicit, pass to other libraries)
const rpc = helius.raw;
const balance = await rpc.getBalance(address).send();
```

## Recommendations

### Use `getTransactionsForAddress` Instead of `getSignaturesForAddress` + `getTransaction`

`getTransactionsForAddress` combines signature lookup and transaction fetching into a single call with server-side filtering. It supports time/slot ranges, token account filtering, and pagination. This is always preferable to the two-step approach.

```typescript
// GOOD: Single call, server-side filtering
const txs = await helius.getTransactionsForAddress([
  "address",
  {
    transactionDetails: "full",
    limit: 100,
    filters: {
      tokenAccounts: "balanceChanged",
      blockTime: { gte: oneDayAgo },
    },
  },
]);

// BAD: Two calls, client-side filtering, no token account support
const sigs = await helius.raw.getSignaturesForAddress(address).send();
const txs = await Promise.all(sigs.map(s => helius.raw.getTransaction(s.signature).send()));
```

### Use `sendSmartTransaction` for Standard Sends

It automatically simulates, estimates compute units, fetches priority fees, and confirms. Don't manually build ComputeBudget instructions.

```typescript
const sig = await helius.tx.sendSmartTransaction({
  instructions: [yourInstruction],
  signers: [walletSigner],
  commitment: "confirmed",
  priorityFeeCap: 100_000,   // Optional: cap fees in microlamports/CU
  bufferPct: 0.1,            // 10% compute unit headroom (default)
});
```

### Use Helius Sender for Ultra-Low Latency

For time-sensitive transactions (arbitrage, sniping, liquidations), reliability, and the fastest landing speeds on Solana, use `sendTransactionWithSender`. It routes through Helius's multi-region infrastructure and Jito.

```typescript
const sig = await helius.tx.sendTransactionWithSender({
  instructions: [yourInstruction],
  signers: [walletSigner],
  region: "US_EAST",          // Default, US_SLC, US_EAST, EU_WEST, EU_CENTRAL, EU_NORTH, AP_SINGAPORE, AP_TOKYO
  swqosOnly: true,            // Route through SWQOS only
  pollTimeoutMs: 60_000,
  pollIntervalMs: 2_000,
});
```

### Use Webhooks or WebSockets Instead of Polling

Don't poll `getTransactionsForAddress` or `getSignaturesForAddress` in a loop. Use webhooks for server-to-server notifications or WebSockets for real-time client-side streaming. 

```typescript
// Webhook: server receives POST on matching transactions
const webhook = await helius.webhooks.create({
  webhookURL: "https://your-server.com/webhook",
  webhookType: "enhanced",
  transactionTypes: ["TRANSFER", "NFT_SALE", "SWAP"],
  accountAddresses: ["address_to_monitor"],
  authHeader: "Bearer your-secret",
});

// WebSocket: stream logs in real-time
const req = await helius.ws.logsNotifications({ mentions: ["address"] });
const stream = await req.subscribe({ abortSignal: controller.signal });
for await (const log of stream) {
  console.log(log);
}
```

### Use `getAssetBatch` for Multiple Assets

When fetching more than one asset, batch them. Don't call `getAsset` in a loop.

```typescript
// GOOD: Single request
const assets = await helius.getAssetBatch({
  ids: ["mint1", "mint2", "mint3"],
  options: { showFungible: true, showCollectionMetadata: true },
});

// BAD: N requests
const assets = await Promise.all(mints.map(id => helius.getAsset({ id })));
```

## Pagination

The SDK uses different pagination strategies depending on the method:

### Token/Cursor-Based (RPC V2 Methods)

```typescript
// getTransactionsForAddress — uses paginationToken
let paginationToken = null;
const allTxs = [];
do {
  const result = await helius.getTransactionsForAddress([
    "address",
    { limit: 100, paginationToken },
  ]);
  allTxs.push(...result.data);
  paginationToken = result.paginationToken;
} while (paginationToken);

// getProgramAccountsV2 — uses paginationKey
// getTokenAccountsByOwnerV2 follows the same shape (paginationKey, accounts, totalResults)
let paginationKey = null;
do {
  const result = await helius.getProgramAccountsV2([
    programId,
    { limit: 1000, paginationKey },
  ]);
  // process result.accounts
  paginationKey = result.paginationKey;
} while (paginationKey);
```

### Page-Based (DAS API)

```typescript
let page = 1;
const allAssets = [];
while (true) {
  const result = await helius.getAssetsByOwner({ ownerAddress: "...", page, limit: 1000 });
  allAssets.push(...result.items);
  if (result.items.length < 1000) break;
  page++;
}
```

## tokenAccounts Filter

When querying `getTransactionsForAddress`, the `tokenAccounts` filter controls whether token account activity is included:

| Value | Behavior | Use When |
|-------|----------|----------|
| omitted / `"none"` | Only transactions directly involving the address | You only care about SOL transfers and program calls |
| `"balanceChanged"` | Also includes token transactions that changed a balance | **Recommended for most agents** — shows token sends/receives without noise |
| `"all"` | Includes all token account transactions | You need complete token activity (can return many results) |

## Rate Limits & Plans

| Feature | Free | Developer $49/mo | Business $499/mo | Professional $999/mo |
|---------|------|------------------|------------------|----------------------|
| Monthly Credits | 1M | 10M | 100M | 200M |
| RPC Rate Limit | 10 req/s | 50 req/s | 200 req/s | 500 req/s |
| DAS & Enhanced API | 2 req/s | 10 req/s | 50 req/s | 100 req/s |
| Helius Sender | 15/s | 15/s | 15/s | 15/s |
| Enhanced WebSockets | No | No | Yes | Yes |
| LaserStream gRPC | No | Devnet | Devnet | Devnet + Mainnet |

Monitor usage via the [Helius CLI](https://www.helius.dev/docs/api-reference/helius-cli) using the command `helius usage --json`. Verify current limits at https://docs.helius.dev — the table above may be outdated.

## Error Handling & Retries

```typescript
try {
  const result = await helius.getAsset({ id: "mint_address" });
} catch (error) {
  // Common HTTP status codes:
  // 401 = Invalid or missing API key
  // 429 = Rate limited (too many requests or out of credits)
  // 5xx = Server error (retry with backoff)
  console.error(error.message);
}
```

### Retry Strategy

Retry on 429 and 5xx errors with exponential backoff. The SDK throws native `Error` objects with the HTTP status code embedded in the message string (e.g., `"API error (429): ..."` or `"HTTP error! status: 500 - ..."`). There is no `.status` property on the error object, so status detection requires message parsing:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // SDK errors embed status in message: "API error (429): ..." or "HTTP error! status: 500 - ..."
      const msg = error instanceof Error ? error.message : "";
      const status = msg.match(/\b(\d{3})\b/)?.[1];
      const retryable = status === "429" || (status && status.startsWith("5"));
      if (!retryable || attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw new Error("Unreachable");
}
```

## Common Gotchas

1. **Don't forget `transactionDetails: "full"`** — By default, `getTransactionsForAddress` returns signatures only, not full transaction data. Set `transactionDetails: "full"` if you need transaction contents.

2. **Don't manually add ComputeBudget instructions with `sendSmartTransaction`** — The SDK adds them automatically. Adding your own will result in duplicate instructions and transaction failure.

3. **Priority fees are in microlamports per compute unit** — Not lamports. When using `getPriorityFeeEstimate`, the returned values are already in the right unit for `SetComputeUnitPrice`.

4. **DAS pagination is 1-indexed** — `page: 1` is the first page, not `page: 0`.

5. **`blockTime` is Unix seconds, not milliseconds** — When filtering by `blockTime` in `getTransactionsForAddress`, use seconds (e.g., `Math.floor(Date.now() / 1000)`).

6. **`getAsset` hides fungible tokens by default** — Pass `options: { showFungible: true }` to include them.

7. **WebSocket streams need cleanup** — Always use an AbortController signal and call `helius.ws.close()` when done to avoid connection leaks.

## API Quick Reference

### DAS API (Digital Asset Standard)

```typescript
helius.getAsset({ id })                                    // Single asset by mint
helius.getAssetBatch({ ids })                              // Multiple assets
helius.getAssetsByOwner({ ownerAddress, page, limit })     // Assets by wallet
helius.getAssetsByAuthority({ authorityAddress })            // Assets by update authority
helius.getAssetsByCreator({ creatorAddress })               // Assets by creator
helius.getAssetsByGroup({ groupKey, groupValue })           // Assets by collection
helius.searchAssets({ ownerAddress, tokenType, ... })       // Flexible search
helius.getAssetProof({ id })                                // Merkle proof (cNFTs)
helius.getAssetProofBatch({ ids })                          // Batch Merkle proofs
helius.getTokenAccounts({ owner })                          // Token accounts
helius.getNftEditions({ id })                               // Print editions
helius.getSignaturesForAsset({ id })                        // Transaction history for asset
```

### RPC V2 Methods

```typescript
helius.getTransactionsForAddress([address, config])         // Transaction history (paginationToken)
helius.getProgramAccountsV2([programId, config])            // Program accounts (paginationKey)
helius.getTokenAccountsByOwnerV2([owner, filter?, config?]) // Token accounts — same shape as gPAv2 (paginationKey)
helius.getPriorityFeeEstimate({ accountKeys, options })     // Fee estimates
```

### Transactions

```typescript
helius.tx.sendSmartTransaction({ instructions, signers })   // Auto-optimized send
helius.tx.createSmartTransaction({ instructions, signers }) // Build without sending
helius.tx.sendTransactionWithSender({ ..., region })        // Helius Sender (low latency)
```

### Enhanced Transactions

```typescript
helius.enhanced.getTransactions({ transactions })           // Parse by signatures
helius.enhanced.getTransactionsByAddress({ address })       // Parse by address
```

### Webhooks

```typescript
helius.webhooks.create({ webhookURL, transactionTypes, accountAddresses })
helius.webhooks.get(webhookID)
helius.webhooks.getAll()
helius.webhooks.update(webhookID, params)
helius.webhooks.delete(webhookID)
```

### WebSockets

```typescript
helius.ws.logsNotifications(filter, config)                 // Transaction logs
helius.ws.accountNotifications(address, config)             // Account changes
helius.ws.signatureNotifications(signature, config)         // Tx confirmation
helius.ws.slotNotifications(config)                         // Slot updates
helius.ws.programNotifications(programId, config)           // Program account changes
helius.ws.close()                                           // Clean up connections
```

### Staking

```typescript
helius.stake.createStakeTransaction(owner, amountSol)                           // Stake SOL
helius.stake.createUnstakeTransaction(ownerSigner, stakeAccount)                 // Unstake
helius.stake.createWithdrawTransaction(withdrawAuth, stakeAcct, dest, lamports)  // Withdraw
helius.stake.getHeliusStakeAccounts(wallet)                  // List stake accounts
```

### Wallet API

```typescript
helius.wallet.getBalances({ wallet })                       // Token balances
helius.wallet.getHistory({ wallet })                        // Transaction history
helius.wallet.getTransfers({ wallet })                      // Transfer history
helius.wallet.getIdentity({ wallet })                       // Known identity lookup
helius.wallet.getBatchIdentity({ addresses })               // Batch identity (max 100)
helius.wallet.getFundedBy({ wallet })                       // Funding source
```

### ZK Compression

```typescript
helius.zk.getCompressedAccount({ address })                 // Single compressed account
helius.zk.getCompressedAccountsByOwner({ owner })           // By owner
helius.zk.getCompressedTokenAccountsByOwner({ owner })      // Compressed tokens
helius.zk.getCompressedAccountProof({ hash })               // Merkle proof
helius.zk.getCompressedBalance({ address })                 // Balance
helius.zk.getValidityProof({ hashes })                      // Validity proof
```

### Auth (Standalone Import)

The auth module is not on the main `HeliusClient` — import it separately via `helius-sdk/auth/client`. This is used for programmatic agent signup flows. The step-by-step flow requires signing an auth message first to obtain a JWT, then using that JWT for all subsequent API calls.

```typescript
import { makeAuthClient } from "helius-sdk/auth/client";

const auth = makeAuthClient();

// Step-by-step flow (JWT-based):
const keypair = await auth.generateKeypair();                             // Generate Ed25519 keypair
const address = await auth.getAddress(keypair);                           // Get wallet address (async)
const { message, signature } = await auth.signAuthMessage(keypair.secretKey); // Sign auth message
const { token } = await auth.walletSignup(message, signature, address);   // Get JWT via signup
const projects = await auth.listProjects(token);                          // List projects (needs JWT)
const project = await auth.createProject(token);                          // Create project (needs JWT)
const apiKey = await auth.createApiKey(token, project.id, address);       // Create API key (needs JWT)

// Or use the all-in-one shortcut:
const result = await auth.agenticSignup({ secretKey: keypair.secretKey }); // Full automated flow
// result: { jwt, walletAddress, projectId, apiKey, endpoints, credits }
```

## Documentation

- Full API Reference: https://docs.helius.dev
- LLM-Optimized Docs: https://www.helius.dev/docs/llms.txt
- @solana/kit Docs: https://www.solanakit.com
- Examples: https://github.com/helius-labs/helius-sdk/tree/main/examples
- Migration Guide (1.x to 2.x): https://github.com/helius-labs/helius-sdk/blob/main/MIGRATION.md

---

## Contributing

For AI agents contributing to this repository, see [CLAUDE.md](CLAUDE.md) for full details. Quick reference:

```bash
pnpm install          # Install dependencies
pnpm build            # Build ESM & CJS
pnpm test             # Run tests (65%+ coverage required)
pnpm format           # Format with Prettier
pnpm lint             # Lint with ESLint
pnpm check-bundle     # Verify tree-shakability & bundle sizes
```

Before submitting a PR: `pnpm format && pnpm lint && pnpm test && pnpm check-bundle`

Key architecture decisions, code style conventions, lazy loading patterns, and PR process are documented in [CLAUDE.md](CLAUDE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
