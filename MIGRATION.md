# Migrating to `helius-sdk` 2.0.0

The Helius Node.js SDK has been rewritten on top of [`@solana/kit`](https://github.com/anza-xyz/kit), replacing the dependency on `@solana/web3.js` (>1.73.2). The goal: keep DevEx familiar while improving ergonomics, performance, and type safety while supporting the latest Solana developments.  

The TLDR is most method names are unchanged. What has changed is their namespace and the exact types, reflecting the latest types via Kit.

---

## 1) Installation

```bash
# Install the SDK
npm i helius-sdk

# Optional: install Kit if you need to use their helpers directly in your app
npm i @solana/kit
```

## 2) Quickstart

### Before 2.x
```typescript
import { Helius } from "helius-sdk";
import { PublicKey } from "@solana/web3.js;

const helius = new Helius(process.env.HELIUS_API_KEY);
const assets = await helius.getAssetsByOwner({ ownerAddress: "..." });
```
### After 2.x
```typescript
import { createHelius } from "helius-sdk";
import { address } from "@solana/kit";

const helius = createHelius({ apiKey: process.env.HELIUS_API_KEY! });
const assets = await helius.getAssetsByOwner({ ownerAddress: address("...") });
```

## 3) Import Paths and Tree-shaking
This package is ESM-first (i.e., `"type": "module"`). Use `import`, not `require`.

The root is the `src` dir, with the main functionality deriving from the `createHelius` function. There are also subpaths for more granular tree-shaking:
- RPC methods: `import "helius-sdk/rpc/methods/<>`
- Enhanced Transactions API: `import "helius-sdk/enhanced/<>`
- Staking: `import "helius-sdk/staking/<>`
- Transactions: `import "helius-sdk/transactions/<>`
- Types: `import type { Foo } from "helius-sdk/types/<>`
- Webhooks: `import "helius-sdk/webhooks/<>`
- WebSockets: `import "helius-sdk/websockets/<>`
- ZK: `import "helius-sdk/zk/<>`

Note, the SDK is designed such that these granular imports are not 100% necessary. The package sets `sideEffects` to `false`, meaning bundlers can safely tree-shake unusued code.

## 4) Migration Cheatsheet
| Area           | 1.x                                      | 2.x                                             |
|----------------|------------------------------------------|-------------------------------------------------|
| Client init    | `new Helius()`                           | `createHelius()`                                |
| Public key     | `new PublicKey(str)`                     | `address(str)`                                  |
| Amounts        | `new BN(...)` / Number(...)              | `lamports(...n)`                                |
| Signer         | `Keypair.fromSecretKey(bs58.decode(""))` | `createKeyPairSignerFromBytes(bs58.decode(""))` |
| Transactions   | `helius.rpc.<method>`                    | `helius.tx.<method>`                            |
| DAS API        | `helius.rpc.<method>`                    | `helius.<method>`                               |
| Staking        | `helius.rpc.<method>`                    | `helius.stake.<method>`                         |
| Webhooks       | `helius.<method>`                        | `helius.webhooks.<method>`                      |
| Enhanced Tx    | No support                               | `helius.enhanced.<method>`                      |
| ZK Compression | No support                               | `helius.zk.<method>`                            |
| WebSockets     | @solana/web3.js subscriptions            | `helius.ws.<method>`                            |

## 5) Breaking Changes
1. Client Construction: `createHelius()` factory instead of `new Helius()`
2. Kit Primitives: prefer `address()`, `lamports()`, and other helpers provided by Kit
3. Full Helius Support: can now use ZK Compression, the Enhanced Transactions API, WebSockets, and Sender via the SDK
4. Deprecated Jito Methods: prefer [Sender](https://www.helius.dev/docs/sending-transactions/sender) for transaction submission
5. `editWebhook` is renamed to `update`
6. ESM-Only: use `import`; if using CommonJS, transpile or use dynamic `import()`

## 6) Endpoint Mapping
- DAS (`helius.`): `getAsset`, `getAssetBatch`, `getAssetProof`, `getAssetProofBatch`, `getAssetsByAuthority`, `getAssetsByCreator`, `getAssetsByGroup`, `getAssetsByOwner`, `getNftEditions`, `getTokenAccounts`, `searchAssets`
- RPC V2 (`helius.`): `getProgramAccountsV2`, `getTokenAccountsByOwnerV2`, `getAllProgramAccounts`, `getAllTokenAccountsByOwner`
- Priority Fee API (`helius.`): `getPriorityFeeEstimate`
- Enhanced Transactions API (`helius.enhanced.`): `getTransactions`, `getTransactionsByAddress`
- Staking (`helius.stake.`): `createStakeTransaction`, `createUnstakeTransaction`, `createWithdrawTransaction`, `getHeliusStakeAccounts`, `getStakeInstruction`, `getUnstakeInstruction`, `getWithdrawInstruction`, `getWithdrawableAmount`
- Transactions (`helius.tx.`): `broadcastTransaction`, `getComputeUnits`, `pollTransactionConfirmation`, `createSmartTransaction`, `sendSmartTransaction`, `sendTransactionWithSender`, `sendTransaction`
- Webhooks (`helius.webhooks.`): `create`, `get`, `getAll`, `update`, `delete`
- WebSockets (`helius.ws.`): `logsNotifications`, `slotNotifications`, `signatureNotifications`, `programNotifications`, `accountNotifications`, `close`
- ZK Compression (`helius.zk.`): `getCompressedAccount`, `getCompressedAccountProof`, `getCompressedAccountsByOwner`, `getCompressedBalance`, `getCompressedBalanceByOwner`, `getCompressedMintTokenHolders`, `getCompressedTokenAccountBalance`, `getCompressedTokenAccountsByDelegate`, `getCompressedTokenAccountsByOwner`, `getCompressedTokenBalancesByOwner`, `getCompressedTokenBalancesByOwnerV2`, `getCompressionSignaturesForAccount`, `getCompressionSignaturesForAddress`, `getCompressionSignaturesForOwner`, `getCompressionSignaturesForTokenOwner`, `getIndexerHealth`, `getIndexerSlot`, `getLatestCompressionSignatures`, `getLatestNonVotingSignatures`, `getMultipleCompressedAccountProofs`, `getMultipleCompressedAccounts`, `getMultipleNewAddressProofs`, `getMultipleNewAddressProofsV2`, `getTransactionWithCompressionInfo`, `getValidityProof`, `getSignaturesForAsset`

## 7) FAQ
**Do I need to change my RPC URL?**
- No, your existing Helius RPC URL still works.

**Do I need to install `@solana/kit`?**
- While not strictly required since the SDK bundles it internally, you'll likely have to install Kit to use its helpers throughout your codebase. Please refer to [Kit's documentation site](https://www.solanakit.com/) for any Kit-related troubleshooting.

**Is 1.x deprecated?**
- Yes. We recommend everyone updates to a 2.x version in accordance to the latest developments on Solana. We will be maintaining 2.x versions going forward.

**Why the migration?**
- Smaller bundles, faster cold start in edge runtimes, better types, cleaner codebase that's easier to maintain and contribute to, more complete Helius support, and to stay up-to-date with the latest Solana developments.

## 8) Examples
See the [`examples` directory](https://github.com/helius-labs/helius-sdk/tree/main/examples), organized by namespace, for example implementations for:
- DAS (assets, proofs, fetching program accounts)
- Transactions (creating optimized transactions, Sender)
- Staking (how to stake with Helius, as well as any staking-related functionality)
- Enhanced Transactions (fetching transactions for a given address or addresses)
- Webhooks (programmatic event-driven updates)
- WebSockets (listening to accounts for specific updates)

## 9) Support
- Docs: https://www.helius.dev/docs
- Discord: https://discord.com/invite/6GXdee3gBj
- Chat support: https://dashboard.helius.dev/support
- Email support: support@helius.xyz