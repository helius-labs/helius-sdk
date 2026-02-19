# Helius TypeScript SDK

TypeScript SDK for Helius APIs and Solana development. Built on @solana/kit with dual ESM/CJS output, lazy loading, and tree-shaking.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build ESM & CJS via Rollup
pnpm test                 # Run Jest tests (65%+ coverage required)
pnpm test:coverage        # Run tests with coverage report
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting (CI runs this)
pnpm lint                 # Lint with ESLint
pnpm check-bundle         # Build + verify tree-shakability + bundle sizes
```

Before submitting a PR, run: `pnpm format && pnpm lint && pnpm test && pnpm check-bundle`

CI runs formatting, linting, tests, build, tree-shake checks, and bundle size checks on every push and PR to `main`.

## Project Structure

```
src/
  rpc/
    index.ts              # Main HeliusClient with lazy-loaded methods
    methods/              # Individual DAS & RPC methods (getAsset, searchAssets, etc.)
    caller.ts             # RPC caller abstraction
    lazy.ts               # defineLazyMethod / defineLazyNamespace helpers
    wrapAutoSend.ts       # Auto-send transaction wrapper
  transactions/           # Smart transactions & Helius Sender
  webhooks/               # Webhook CRUD (create, get, update, delete)
  enhanced/               # Enhanced transaction parsing
  staking/                # Helius validator staking helpers
  websockets/             # WebSocket subscriptions (logs, slots, accounts)
  zk/                     # ZK Compression methods
  wallet/                 # Wallet API (balances, history, transfers)
  auth/                   # Agent authentication & signup
  types/
    das.ts                # DAS API types (Asset, GetAssetRequest, etc.)
    enums.ts              # Network, TransactionDetails, TokenAccountsFilter
    webhooks.ts           # Webhook types
  http.ts                 # HTTP client with SDK User-Agent header
  version.ts              # Auto-generated at build time — do not edit
examples/                 # Usage examples organized by namespace
dist/                     # Generated output — do not edit or commit
```

## Architecture

### Lazy Loading

All methods and sub-clients load on first access via `defineLazyMethod` and `defineLazyNamespace` in `src/rpc/lazy.ts`. This reduces the initial bundle by 70%+. Every new method or namespace must use this pattern.

```typescript
defineLazyMethod<HeliusClient, GetAssetFn>(client, "getAsset", async () => {
  const { makeGetAsset } = await import("./methods/getAsset.js");
  return makeGetAsset(call);
});
```

### Factory Pattern

Each method exports a `make*` factory that receives its dependencies:

```typescript
export const makeGetAsset = (call: RpcCaller): GetAssetFn => async (params) => {
  return call("getAsset", params);
};
```

### Sub-Clients

Namespaced functionality lives in sub-clients accessed via the main `HeliusClient`:
- `helius.enhanced.*` — Enhanced transaction parsing
- `helius.tx.*` — Smart transactions & Sender
- `helius.webhooks.*` — Webhook management
- `helius.ws.*` — WebSocket subscriptions
- `helius.stake.*` — Staking operations
- `helius.zk.*` — ZK Compression
- `helius.wallet.*` — Wallet API

Standard Solana RPC methods (getBalance, getSlot, etc.) are available directly on `helius.*` via a Proxy to the underlying @solana/kit RPC client. DAS API methods are also available directly on `helius.*`.

### Dual ESM/CJS

Rollup builds both formats from a single source. ESM for modern bundlers, CJS for legacy Node.js and Jest. `preserveModules` is enabled for tree-shaking. Both outputs live under `dist/`.

### No Side Effects

The SDK is marked `"sideEffects": false`. Never introduce top-level runtime calls. Use type assertions instead:

```typescript
// Good: no side effect
"ComputeBudget111111111111111111111111111111" as Address

// Bad: runtime call at module level
address("ComputeBudget111111111111111111111111111111")
```

### User-Agent Tracking

All HTTP requests include `helius-node-sdk/<version> (node|browser|deno)` via `SDK_USER_AGENT` in `src/http.ts`. The version is injected at build time. Never manually modify the User-Agent.

## Code Style

- **Naming:** camelCase (functions/variables), PascalCase (types/interfaces), SCREAMING_SNAKE_CASE (constants)
- **Strings:** Double quotes always
- **Functions:** Arrow functions preferred, `const` by default
- **Async:** async/await with try/catch; never throw non-Error objects
- **Exports:** Named exports, no default exports
- **Types:** Strict TypeScript (noImplicitAny, noUnusedLocals, noUnusedParameters)
- **JSDoc:** Required on all public methods
- **File naming:** camelCase or kebab-case, consistent with surrounding files

## Testing

Tests are colocated with source in `src/*/tests/` directories. Use Jest with `ts-jest`.

```typescript
// src/rpc/methods/tests/getAsset.test.ts
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

Coverage threshold: 65% across branches, functions, lines, and statements.

## Adding New Functionality

### New RPC Method

1. Create `src/rpc/methods/yourMethod.ts` with a `makeYourMethod` factory
2. Define a `YourMethodFn` type (use overloads if return type varies by params)
3. Add lazy loading in `src/rpc/index.ts` using `defineLazyMethod`
4. Add to the `HeliusClient` type interface with a JSDoc comment
5. Create `src/rpc/methods/tests/yourMethod.test.ts`
6. Add `examples/helius/yourMethod.ts`

### New Namespace

1. Create `src/yourNamespace/` with `client.ts` exporting `makeYourNamespaceClient`
2. Add lazy loading in `src/rpc/index.ts` using `defineLazyNamespace`
3. Add to `HeliusClient` type: `yourNamespace: YourNamespaceClient`
4. Add tests in `src/yourNamespace/tests/`
5. Add examples in `examples/yourNamespace/`
6. Add export path in `package.json` `"exports"` field

### New Types

- DAS types: `src/types/das.ts`
- Enums: `src/types/enums.ts`
- Namespace-specific: `src/yourNamespace/types.ts`
- Always export types for external consumers

## Bundle Size Constraints

- Individual method modules: <2.5kb
- Entry points (e.g., `dist/esm/rpc/index.js`): <2kb
- Run `pnpm check-bundle` to verify; uses agadoo for tree-shake checks and bundlemon for size limits

## Git & PR Conventions

- Branch from `main`
- Branch naming: `feat/description` or `fix/description`
- PR title format: `feat(namespace): Title` or `fix(namespace): Title`
- Include `Co-Authored-By` for AI contributions
- Reference issues: `Closes #123`
- CI runs lint, test, and build jobs on pushes and PRs to `main`

## Boundaries

- **Never commit:** API keys, secrets, .env files, private keys, seed phrases
- **Never break tree-shaking:** No top-level side effects, no barrel re-exports with side effects
- **Don't edit generated files:** `src/version.ts` and `dist/` are build artifacts
- **Match Helius API specs:** See https://www.helius.dev/docs
- **Maintain dual ESM/CJS:** Both formats must work
- **Minimum Node.js 20:** Relies on native fetch
- **Use @solana/kit:** Not @solana/web3.js (see MIGRATION.md for context)
- **Externalize deps in Rollup:** @solana/kit, @solana-program/*, bs58
