import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
} from "@solana/kit";

import { getSDKHeaders } from "../http";

import { wrapAutoSend } from "./wrapAutoSend";
import type { WebhookClient } from "../webhooks/client";
import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
} from "../types/webhooks";
import { defineLazyMethod, defineLazyNamespace } from "./lazy";
import { makeRpcCaller } from "./caller";
import type { GetAssetFn } from "./methods/getAsset";
import type { GetAssetBatchFn } from "./methods/getAssetBatch";
import type { GetAssetProofFn } from "./methods/getAssetProof";
import type { GetAssetProofBatchFn } from "./methods/getAssetProofBatch";
import type { GetAssetsByAuthorityFn } from "./methods/getAssetsByAuthority";
import type { GetAssetsByCreatorFn } from "./methods/getAssetsByCreator";
import type { GetAssetsByGroupFn } from "./methods/getAssetsByGroup";
import type { GetPriorityFeeEstimateFn } from "./methods/getPriorityFeeEstimate";
import type { GetAssetsByOwnerFn } from "./methods/getAssetsByOwner";
import type { GetNftEditionsFn } from "./methods/getNftEditions";
import type { GetSignaturesForAssetFn } from "./methods/getSignaturesForAsset";
import type { GetTokenAccountsFn } from "./methods/getTokenAccounts";
import type { SearchAssetsFn } from "./methods/searchAssets";
import type { GetProgramAccountsV2Fn } from "./methods/getProgramAccountsV2";
import type { GetAllProgramAccountsFn } from "./methods/getAllProgramAccounts";
import type { GetTokenAccountsByOwnerV2Fn } from "./methods/getTokenAccountsByOwnerV2";
import type { GetAllTokenAccountsByOwnerFn } from "./methods/getAllTokenAccountsByOwner.js";
import type { GetTransactionsForAddressFn } from "./methods/getTransactionsForAddress";
import type { EnhancedTxClientLazy } from "../enhanced";
import { TxHelpersLazy } from "../transactions";
import type { ResolvedHeliusRpcApi } from "./heliusRpcApi";
import { makeWsAsync, WsAsync } from "../websockets/wsAsync";
import { StakeClientLazy } from "../staking/client";
import { ZkClientLazy } from "../zk/client";
import type { WalletClient } from "../wallet/client";
import type { HeliusRpcOptions } from "./types";

export type { HeliusRpcOptions };

/**
 * The main Helius SDK client. Provides access to all Helius and Solana RPC
 * methods, DAS (Digital Asset Standard) queries, priority fee estimation,
 * webhooks, enhanced transaction parsing, smart transaction helpers,
 * WebSocket subscriptions, staking, and ZK compression.
 *
 * All standard Solana RPC methods (e.g. `getBalance`, `getSlot`) are available
 * directly on this object via a Proxy that delegates to the underlying
 * `@solana/kit` RPC client.
 *
 * Sub-clients (`webhooks`, `enhanced`, `tx`, `ws`, `stake`, `zk`, `wallet`)
 * are lazily loaded on first access to keep the initial bundle minimal.
 */
export type HeliusClient = ResolvedHeliusRpcApi & {
  /** The unwrapped Solana RPC client for direct access to standard RPC methods. */
  raw: ResolvedHeliusRpcApi;

  // ── DAS (Digital Asset Standard) ──────────────────────────────────

  /** Fetch a single asset by its ID (mint address). */
  getAsset: GetAssetFn;
  /** Fetch multiple assets by their IDs in a single batch request. */
  getAssetBatch: GetAssetBatchFn;
  /** Get the Merkle proof for a compressed asset. */
  getAssetProof: GetAssetProofFn;
  /** Get Merkle proofs for multiple compressed assets in a batch. */
  getAssetProofBatch: GetAssetProofBatchFn;
  /** List assets by their update authority address. */
  getAssetsByAuthority: GetAssetsByAuthorityFn;
  /** List assets created by a specific creator address. */
  getAssetsByCreator: GetAssetsByCreatorFn;
  /** List assets belonging to a specific group (e.g. a collection). */
  getAssetsByGroup: GetAssetsByGroupFn;
  /** List all assets owned by a wallet address. */
  getAssetsByOwner: GetAssetsByOwnerFn;
  /** Get transaction signatures related to an asset. */
  getSignaturesForAsset: GetSignaturesForAssetFn;
  /** Get print editions for an NFT master edition. */
  getNftEditions: GetNftEditionsFn;
  /** Get token accounts filtered by mint or owner. */
  getTokenAccounts: GetTokenAccountsFn;
  /** Search for assets using flexible filters (owner, creator, collection, etc.). */
  searchAssets: SearchAssetsFn;

  // ── Priority Fee API ──────────────────────────────────────────────

  /** Estimate priority fees for a transaction or set of account keys. */
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;

  // ── V2 RPC Methods ────────────────────────────────────────────────

  /** Paginated version of `getProgramAccounts` with cursor-based pagination. */
  getProgramAccountsV2: GetProgramAccountsV2Fn;
  /** Auto-paginating variant that fetches all program accounts across pages. */
  getAllProgramAccounts: GetAllProgramAccountsFn;
  /** Paginated version of `getTokenAccountsByOwner` with cursor-based pagination. */
  getTokenAccountsByOwnerV2: GetTokenAccountsByOwnerV2Fn;
  /** Auto-paginating variant that fetches all token accounts for an owner. */
  getAllTokenAccountsByOwner: GetAllTokenAccountsByOwnerFn;
  /** Get transactions for a specific address with rich filtering and pagination. */
  getTransactionsForAddress: GetTransactionsForAddressFn;

  // ── Webhooks ──────────────────────────────────────────────────────

  /** Webhook management client. Requires an API key. */
  webhooks: {
    /** Create a new webhook subscription. */
    create(params: CreateWebhookRequest): Promise<Webhook>;
    /** Get a webhook by its ID. */
    get(webhookID: string): Promise<Webhook>;
    /** List all webhooks for the current API key. */
    getAll(): Promise<Webhook[]>;
    /** Update an existing webhook. */
    update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
    /** Delete a webhook by its ID. */
    delete(webhookID: string): Promise<boolean>;
  } & WebhookClient;

  /** Enhanced transaction parsing client. Requires an API key. */
  enhanced: EnhancedTxClientLazy;

  /** Smart transaction helpers for building, signing, and sending transactions with automatic compute budget and priority fees. */
  tx: TxHelpersLazy;

  /** WebSocket RPC subscriptions (logs, slots, signatures, programs, accounts). */
  ws: WsAsync;

  /** Helius native staking helpers (stake, unstake, withdraw to the Helius validator). */
  stake: StakeClientLazy;

  /** ZK compression RPC methods for Light Protocol compressed accounts and tokens. */
  zk: ZkClientLazy;

  /** Wallet API client. Requires an API key. */
  wallet: WalletClient;
};

/**
 * Create a Helius SDK client.
 *
 * @example
 * ```ts
 * import { createHelius } from "helius-sdk";
 *
 * const helius = createHelius({ apiKey: "YOUR_API_KEY" });
 *
 * // Standard Solana RPC
 * const balance = await helius.getBalance("So11...").send();
 *
 * // DAS — fetch an asset
 * const asset = await helius.getAsset({ id: "MINT_ADDRESS" });
 *
 * // Smart transactions
 * const sig = await helius.tx.sendSmartTransaction({ signers, instructions });
 * ```
 */
export const createHelius = ({
  apiKey,
  network = "mainnet",
  rebateAddress,
  baseUrl,
  userAgent,
}: HeliusRpcOptions): HeliusClient => {
  // Use custom baseUrl if provided, otherwise construct from network
  const resolvedBaseUrl = baseUrl ?? `https://${network}.helius-rpc.com/`;

  // Build query parameters
  const queryParams: string[] = [];
  if (apiKey) {
    queryParams.push(`api-key=${apiKey}`);
  }
  if (rebateAddress) {
    queryParams.push(`rebate-address=${rebateAddress}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  const url = `${resolvedBaseUrl}${queryString}`;

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const baseTransport = createDefaultRpcTransport({
    url,
    headers: getSDKHeaders(userAgent),
  });
  const transport = async <TResponse>(
    request: Parameters<typeof baseTransport>[0]
  ): Promise<TResponse> => {
    const payload = {
      ...(request.payload as Record<string, unknown>),
      id: "helius-sdk",
    };

    const modifiedRequest = {
      ...request,
      payload,
    };

    return baseTransport(modifiedRequest) as Promise<TResponse>;
  };

  const baseRpc = createRpc({ api: solanaApi, transport });
  const raw: ResolvedHeliusRpcApi = wrapAutoSend(baseRpc);

  const wsUrl = new URL(url);
  wsUrl.protocol = "wss:";

  // Lazily create when/if transaction helpers need it
  let rpcSubscriptionsPromise:
    | ReturnType<typeof import("@solana/kit").createSolanaRpcSubscriptions>
    | undefined;

  const getRpcSubscriptions = async () => {
    if (rpcSubscriptionsPromise) return rpcSubscriptionsPromise;
    const { createSolanaRpcSubscriptions } = await import("@solana/kit");
    rpcSubscriptionsPromise = createSolanaRpcSubscriptions(wsUrl.toString());
    return rpcSubscriptionsPromise;
  };

  // Lightweight, no-PendingRpcRequest caller for custom DAS/webhook methods
  const call = makeRpcCaller(transport);

  // The object we’ll populate lazily
  const client: any = { raw };

  defineLazyNamespace<HeliusClient, WsAsync>(client, "ws", async () => {
    // Promisified facade; individual methods return Promise<...>
    // so: await helius.ws.logsNotifications(...).subscribe(...) and no stupid TypeScript warnings
    const ws = makeWsAsync(wsUrl.toString());
    client.close = () => ws.close();
    return ws;
  });

  defineLazyMethod<HeliusClient, GetAssetFn>(client, "getAsset", async () => {
    const { makeGetAsset } = await import("./methods/getAsset.js");
    return makeGetAsset(call);
  });

  defineLazyMethod<HeliusClient, GetAssetBatchFn>(
    client,
    "getAssetBatch",
    async () => {
      const { makeGetAssetBatch } = await import("./methods/getAssetBatch.js");
      return makeGetAssetBatch(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetProofFn>(
    client,
    "getAssetProof",
    async () => {
      const { makeGetAssetProof } = await import("./methods/getAssetProof.js");
      return makeGetAssetProof(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetProofBatchFn>(
    client,
    "getAssetProofBatch",
    async () => {
      const { makeGetAssetProofBatch } = await import(
        "./methods/getAssetProofBatch.js"
      );
      return makeGetAssetProofBatch(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetsByAuthorityFn>(
    client,
    "getAssetsByAuthority",
    async () => {
      const { makeGetAssetsByAuthority } = await import(
        "./methods/getAssetsByAuthority.js"
      );
      return makeGetAssetsByAuthority(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetsByCreatorFn>(
    client,
    "getAssetsByCreator",
    async () => {
      const { makeGetAssetsByCreator } = await import(
        "./methods/getAssetsByCreator.js"
      );
      return makeGetAssetsByCreator(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetsByGroupFn>(
    client,
    "getAssetsByGroup",
    async () => {
      const { makeGetAssetsByGroup } = await import(
        "./methods/getAssetsByGroup.js"
      );
      return makeGetAssetsByGroup(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAssetsByOwnerFn>(
    client,
    "getAssetsByOwner",
    async () => {
      const { makeGetAssetsByOwner } = await import(
        "./methods/getAssetsByOwner.js"
      );
      return makeGetAssetsByOwner(call);
    }
  );

  defineLazyMethod<HeliusClient, GetNftEditionsFn>(
    client,
    "getNftEditions",
    async () => {
      const { makeGetNftEditions } = await import(
        "./methods/getNftEditions.js"
      );
      return makeGetNftEditions(call);
    }
  );

  defineLazyMethod<HeliusClient, GetSignaturesForAssetFn>(
    client,
    "getSignaturesForAsset",
    async () => {
      const { makeGetSignaturesForAsset } = await import(
        "./methods/getSignaturesForAsset.js"
      );
      return makeGetSignaturesForAsset(call);
    }
  );

  defineLazyMethod<HeliusClient, GetTokenAccountsFn>(
    client,
    "getTokenAccounts",
    async () => {
      const { makeGetTokenAccounts } = await import(
        "./methods/getTokenAccounts.js"
      );
      return makeGetTokenAccounts(call);
    }
  );

  defineLazyMethod<HeliusClient, SearchAssetsFn>(
    client,
    "searchAssets",
    async () => {
      const { makeSearchAssets } = await import("./methods/searchAssets.js");
      return makeSearchAssets(call);
    }
  );

  defineLazyMethod<HeliusClient, GetPriorityFeeEstimateFn>(
    client,
    "getPriorityFeeEstimate",
    async () => {
      const { makeGetPriorityFeeEstimate } = await import(
        "./methods/getPriorityFeeEstimate.js"
      );
      return makeGetPriorityFeeEstimate(call);
    }
  );

  defineLazyMethod<HeliusClient, GetProgramAccountsV2Fn>(
    client,
    "getProgramAccountsV2",
    async () => {
      const { makeGetProgramAccountsV2 } = await import(
        "./methods/getProgramAccountsV2.js"
      );
      return makeGetProgramAccountsV2(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAllProgramAccountsFn>(
    client,
    "getAllProgramAccounts",
    async () => {
      const { makeGetAllProgramAccounts } = await import(
        "./methods/getAllProgramAccounts.js"
      );
      return makeGetAllProgramAccounts(call);
    }
  );

  defineLazyMethod<HeliusClient, GetTokenAccountsByOwnerV2Fn>(
    client,
    "getTokenAccountsByOwnerV2",
    async () => {
      const { makeGetTokenAccountsByOwnerV2 } = await import(
        "./methods/getTokenAccountsByOwnerV2.js"
      );
      return makeGetTokenAccountsByOwnerV2(call);
    }
  );

  defineLazyMethod<HeliusClient, GetAllTokenAccountsByOwnerFn>(
    client,
    "getAllTokenAccountsByOwner",
    async () => {
      const { makeGetAllTokenAccountsByOwner } = await import(
        "./methods/getAllTokenAccountsByOwner.js"
      );
      return makeGetAllTokenAccountsByOwner(call);
    }
  );

  defineLazyMethod<HeliusClient, GetTransactionsForAddressFn>(
    client,
    "getTransactionsForAddress",
    async () => {
      const { makeGetTransactionsForAddress } = await import(
        "./methods/getTransactionsForAddress.js"
      );
      return makeGetTransactionsForAddress(call);
    }
  );

  defineLazyNamespace<HeliusClient, WebhookClient>(
    client,
    "webhooks",
    async () => {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
        );
      }
      // This one import is enough since the sub-methods in the webhook client
      // are themselves lazily imported inside makeWebhookClient
      const { makeWebhookClient } = await import("../webhooks/client.js");
      return makeWebhookClient(apiKey, userAgent);
    }
  );

  defineLazyNamespace<HeliusClient, EnhancedTxClientLazy>(
    client,
    "enhanced",
    async () => {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
        );
      }
      const { makeEnhancedTxClientLazy } = await import("../enhanced");
      return makeEnhancedTxClientLazy(apiKey, network, userAgent);
    }
  );

  defineLazyNamespace<HeliusClient, TxHelpersLazy>(client, "tx", async () => {
    const { makeTxHelpersLazy } = await import("../transactions");
    const { makeGetPriorityFeeEstimate } = await import(
      "./methods/getPriorityFeeEstimate.js"
    );
    const getPriorityFeeEstimate = makeGetPriorityFeeEstimate(call);

    return makeTxHelpersLazy(
      baseRpc,
      getPriorityFeeEstimate,
      await getRpcSubscriptions()
    );
  });

  defineLazyNamespace<HeliusClient, StakeClientLazy>(
    client,
    "stake",
    async () => {
      const { makeStakeClientLazy } = await import("../staking/client.js");
      return makeStakeClientLazy(baseRpc);
    }
  );

  defineLazyNamespace<HeliusClient, ZkClientLazy>(client, "zk", async () => {
    const { makeZkClientLazy } = await import("../zk/client");
    return makeZkClientLazy(call);
  });

  defineLazyNamespace<HeliusClient, WalletClient>(
    client,
    "wallet",
    async () => {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use the Wallet API. Provide apiKey in createHelius() options."
        );
      }
      const { makeWalletClient } = await import("../wallet/client.js");
      return makeWalletClient(apiKey, userAgent);
    }
  );

  // So we can send standard RPC calls
  const merged = new Proxy(client as any, {
    get(target, prop, receiver) {
      // Prefer helper / DAS / tx / webhooks / enhanced
      if (prop in target) return Reflect.get(target, prop, receiver);
      // Fallback to vanilla Solana RPC (already wrapped by wrapAutoSend)
      return Reflect.get(raw, prop, receiver);
    },
    has(target, prop) {
      return prop in target || prop in raw;
    },
  });

  return merged as HeliusClient;
};
