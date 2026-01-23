# Helius Node.js SDK - Agent Guide

## Overview

TypeScript SDK for Helius APIs and Solana development built on @solana/kit.

**Stack:** Node.js 20+, TypeScript 5.8+, @solana/kit 5.0+, pnpm 9+

**Features:** DAS API, Enhanced Transactions, Webhooks, Helius Sender, RPC V2 Methods, Priority Fee API, Staking, WebSockets, ZK Compression

## Commands

```bash
pnpm install                   # Install dependencies
pnpm build                     # Build ESM & CJS bundles
pnpm test                      # Run Jest tests
pnpm test:watch                # Run tests in watch mode
pnpm test:coverage             # Run tests with coverage report
pnpm format                    # Format code with Prettier
pnpm format:check              # Check code formatting
pnpm lint                      # Lint code with ESLint
pnpm check-bundle              # Verify tree-shakability and bundle sizes
```

## Structure

### Core

- `src/rpc/index.ts` - Main Helius client with lazy-loaded methods
- `src/rpc/methods/` - DAS API & RPC V2 methods (getAsset, getProgramAccountsV2, etc.)
- `src/rpc/wrapAutoSend.ts` - Auto-send transaction wrapper
- `src/rpc/caller.ts` - Lightweight RPC caller for custom methods
- `src/http.ts` - HTTP client with SDK User-Agent

### Feature Modules

- `src/transactions/` - Smart transactions & Helius Sender
- `src/webhooks/` - Webhook management (create, update, delete)
- `src/enhanced/` - Enhanced transaction parsing
- `src/staking/` - Helius validator staking helpers
- `src/websockets/` - WebSocket subscriptions (logs, slots, accounts, etc.)
- `src/zk/` - ZK Compression methods

### Types

- `src/types/das.ts` - DAS API types (Asset, GetAssetRequest, etc.)
- `src/types/enums.ts` - Network, TransactionDetails, TokenAccountsFilter
- `src/types/webhooks.ts` - Webhook types

### Other

- `examples/` - Usage examples organized by namespace
- `src/*/tests/` - Jest tests colocated with source files
- `dist/` - Generated ESM & CJS output

## Architecture & Design Decisions

### Lazy Loading

- Reduces initial bundle size by 70%+ (only load methods you use)
- Critical for frontend applications where bundle size impacts load time
- Enables tree-shaking for optimal production builds
- Implementation: `defineLazyMethod` and `defineLazyNamespace` in `src/rpc/lazy.ts`

### @solana/kit over @solana/web3.js

- Modern, tree-shakeable architecture (web3.js 1.x is ~2MB, Kit is modular)
- Better TypeScript support with strict types
- Improved performance and smaller bundle sizes
- Future-proof: Solana Foundation's recommended SDK going forward
- See [MIGRATION.md](MIGRATION.md) for migration details

### Dual ESM/CJS Exports

- ESM: Modern bundlers (Vite, Webpack 5, Rollup) for optimal tree-shaking
- CJS: Compatibility with legacy Node.js tools and Jest
- Rollup configuration generates both formats from single source

### Colocated Tests

- Easier to find and maintain tests alongside source code
- Clear import paths (e.g., `import { makeGetAsset } from "../getAsset"`)
- Encourages comprehensive test coverage
- Tests mirror the `src/` directory structure in `src/*/tests/`

### SDK User-Agent Tracking

- All requests include `User-Agent: helius-node-sdk/<version> (node|browser|deno)`
- Helps Helius optimize infrastructure and identify SDK-specific issues
- Located in [src/http.ts](src/http.ts) as `SDK_USER_AGENT` constant
- Used across RPC, webhook, and enhanced transaction clients

## Code Style

### Client Usage

```typescript
import { createHelius } from "helius-sdk";

const helius = createHelius({
  apiKey: "your-api-key",
  network: "mainnet", // or "devnet"
});

// DAS API (on main namespace)
const asset = await helius.getAsset({ id: "assetId" });

// Enhanced Transactions
const txs = await helius.enhanced.getTransactions({ signatures: ["sig1"] });

// Smart Transactions
const smartTx = await helius.tx.createSmartTransaction({ instructions, signers });

// Webhooks
const webhook = await helius.webhooks.create({ webhookURL, transactionTypes });

// Staking
const stakeTx = await helius.stake.createStakeTransaction({ wallet, amount });

// WebSockets
await helius.ws.logsNotifications({ mentions: ["address"] }).subscribe((logs) => {
  console.log(logs);
});

// ZK Compression
const account = await helius.zk.getCompressedAccount({ hash: "accountHash" });

// Standard Solana RPC (via @solana/kit)
const balance = await helius.getBalance("address");
```

### TypeScript Conventions

- **Naming:** camelCase (functions/variables), PascalCase (types/interfaces), SCREAMING_SNAKE_CASE (constants)
- **Strict Types:** Enable all strict TypeScript options (noImplicitAny, noUnusedLocals, noUnusedParameters)
- **Async:** Use async/await with try/catch for error handling
- **Exports:** Named exports preferred over default exports
- **File Naming:** camelCase or kebab-case, consistent with surrounding files

### Lazy Loading Pattern

```typescript
// Methods are lazily imported to reduce bundle size
defineLazyMethod<HeliusClient, GetAssetFn>(client, "getAsset", async () => {
  const { makeGetAsset } = await import("./methods/getAsset.js");
  return makeGetAsset(call);
});
```

### Type Overloads (getTransactionsForAddress)

```typescript
// Return type depends on transactionDetails config
export type GetTransactionsForAddressFn = {
  // transactionDetails: "full" => full transaction data
  (params: [string, GetTransactionsForAddressConfigFull]): Promise<GetTransactionsForAddressResultFull>;

  // transactionDetails: "signatures" or omitted => signature data (default)
  (params: [string, GetTransactionsForAddressConfigSignatures?]): Promise<GetTransactionsForAddressResultSignatures>;
};
```

### TokenAccountsFilter (getTransactionsForAddress)

```typescript
// Options: "all" (include all token account txs), "balanceChanged" (only txs that changed balance), or omit
const result = await helius.getTransactionsForAddress([
  "address",
  {
    tokenAccounts: "balanceChanged", // Recommended: reduces noise
    transactionDetails: "full",
    limit: 100,
  }
]);
```

## Testing

Tests use Jest and are colocated with source files in `src/*/tests/` directories:

```typescript
// Example: src/rpc/methods/tests/getAsset.test.ts
import { makeGetAsset } from "../getAsset";

describe("getAsset", () => {
  it("should fetch asset by id", async () => {
    const mockCaller = jest.fn().mockResolvedValue({ id: "asset1" });
    const getAsset = makeGetAsset(mockCaller);
    const result = await getAsset({ id: "asset1" });
    expect(result.id).toBe("asset1");
  });
});
```

### Testing Priorities

- RPC methods and type correctness
- Error handling and edge cases
- Lazy loading behavior
- Transaction building and signing
- Webhook CRUD operations
- WebSocket subscriptions

### Coverage

Aim for 65%+ test coverage (run `pnpm test:coverage`)

### CI

GitHub Actions runs format checks on all PRs to main/dev

## Common Patterns

### Adding a New RPC Method

1. Create method file in `src/rpc/methods/yourMethod.ts`
2. Export a factory function: `export const makeYourMethod = (call: RpcCaller) => ...`
3. Define function type with proper overloads if needed
4. Add lazy loading in `src/rpc/index.ts`:
   ```typescript
   defineLazyMethod<HeliusClient, YourMethodFn>(client, "yourMethod", async () => {
     const { makeYourMethod } = await import("./methods/yourMethod.js");
     return makeYourMethod(call);
   });
   ```
5. Add to `HeliusClient` type interface
6. Create test file in `src/rpc/methods/tests/yourMethod.test.ts`
7. Add usage example in `examples/helius/yourMethod.ts`

### Adding a New Namespace

1. Create namespace directory: `src/yourNamespace/`
2. Create client file: `src/yourNamespace/client.ts`
3. Export factory function: `export const makeYourNamespaceClient = (params) => { ... }`
4. Add lazy loading in `src/rpc/index.ts`:
   ```typescript
   defineLazyNamespace<HeliusClient, YourNamespaceClient>(client, "yourNamespace", async () => {
     const { makeYourNamespaceClient } = await import("../yourNamespace/client.js");
     return makeYourNamespaceClient(params);
   });
   ```
5. Add to `HeliusClient` type interface: `yourNamespace: YourNamespaceClient;`
6. Create tests in `src/yourNamespace/tests/`
7. Add examples in `examples/yourNamespace/`

### Adding New Types

- DAS API types: Add to `src/types/das.ts`
- Enums: Add to `src/types/enums.ts`
- Namespace-specific types: Create `src/yourNamespace/types.ts` or add to existing namespace files
- Always export types for external use

### Working with @solana/kit

```typescript
// Import Kit types and functions
import { address, lamports, type Address } from "@solana/kit";

// Use Kit's type-safe wrappers
const addr = address("wallet_address_string"); // Type: Address
const amount = lamports(1000000n); // Type: Lamports

// Access underlying Solana RPC via baseRpc
const balance = await baseRpc.getBalance(addr).send();
```

## Git Workflow

### Branches

`main` (stable, target for PRs)

### PR Process

1. Fork and branch from `main`
2. Run `pnpm format && pnpm lint && pnpm test && pnpm check-bundle`
3. Open PR to `main`
4. Title format: `feat(namespace): [Title]` for features, `fix(namespace): [Title]` for bug fixes
   - Examples: `feat(rpc): Add getTransactionsForAddress method`, `fix(webhooks): Handle null webhook IDs`
5. Include Co-Authored-By for AI: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
6. Reference related issues (e.g., `Closes #123`)

### Releases

```bash
# Update version in package.json
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
pnpm publish
```

## Boundaries

### Never Commit

API keys, secrets, .env files, private keys, wallet seed phrases

### SDK Version Tracking

- All HTTP requests include SDK version in User-Agent header
- Format: `helius-node-sdk/<version> (node|browser|deno)`
- Automatically set via `SDK_USER_AGENT` constant in [src/http.ts](src/http.ts)
- Version is injected at build time from package.json via prebuild script
- Never manually modify the User-Agent header in SDK code
- Critical for debugging, support, and infrastructure optimization

### Compatibility

- Match Helius API specs exactly (see [docs.helius.dev](https://docs.helius.dev))
- Support both ESM and CJS via dual exports
- Maintain tree-shakability (avoid top-level side effects)
- Follow @solana/kit patterns for RPC methods
- Minimum Node.js version: 20+ (requires native fetch support)

### Migration from 1.x to 2.x

- SDK now uses `@solana/kit` instead of `@solana/web3.js` 1.x
- See [MIGRATION.md](MIGRATION.md) for detailed migration guide
- Kit docs: [solanakit.com](https://www.solanakit.com/)

### Breaking Changes

- Bump version (major for breaking, minor for features, patch for fixes)
- Provide migration guide in PR description

### Performance

- All methods are lazy-loaded to minimize bundle size
- Use tree-shaking-friendly exports
- Run `pnpm check-bundle` to verify bundle size impact

---

See [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md) | Docs: https://docs.helius.dev
