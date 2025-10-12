import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
} from "@solana/kit";

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
import type { EnhancedTxClientLazy } from "../enhanced";
import { TxHelpersLazy } from "../transactions";
import type { ResolvedHeliusRpcApi } from "./heliusRpcApi";
import { makeWsAsync, WsAsync } from "../websockets/wsAsync";
import { StakeClientLazy } from "../staking/client";
import { ZkClientLazy } from "../zk/client";

interface HeliusRpcOptions {
  apiKey: string;
  network?: "mainnet" | "devnet";
  rebateAddress?: string;
}

export type HeliusClient = ResolvedHeliusRpcApi & {
  raw: ResolvedHeliusRpcApi;

  // DAS
  getAsset: GetAssetFn;
  getAssetBatch: GetAssetBatchFn;
  getAssetProof: GetAssetProofFn;
  getAssetProofBatch: GetAssetProofBatchFn;
  getAssetsByAuthority: GetAssetsByAuthorityFn;
  getAssetsByCreator: GetAssetsByCreatorFn;
  getAssetsByGroup: GetAssetsByGroupFn;
  getAssetsByOwner: GetAssetsByOwnerFn;
  getSignaturesForAsset: GetSignaturesForAssetFn;
  getNftEditions: GetNftEditionsFn;
  getTokenAccounts: GetTokenAccountsFn;
  searchAssets: SearchAssetsFn;

  // Priority Fee API
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;

  // V2 RPC methods
  getProgramAccountsV2: GetProgramAccountsV2Fn;
  getAllProgramAccounts: GetAllProgramAccountsFn;
  getTokenAccountsByOwnerV2: GetTokenAccountsByOwnerV2Fn;
  getAllTokenAccountsByOwner: GetAllTokenAccountsByOwnerFn;

  // Webhooks
  webhooks: {
    create(params: CreateWebhookRequest): Promise<Webhook>;
    get(webhookID: string): Promise<Webhook>;
    getAll(): Promise<Webhook[]>;
    update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
    delete(webhookID: string): Promise<boolean>;
  } & WebhookClient;

  // Enhanced Transactions
  enhanced: EnhancedTxClientLazy;

  // Transaction Helpers
  tx: TxHelpersLazy;

  // WebSocket RPC subscriptions
  ws: WsAsync;

  // Staking helpers
  stake: StakeClientLazy;

  // ZK Compression
  zk: ZkClientLazy;
};

export const createHelius = ({
  apiKey,
  network = "mainnet",
  rebateAddress,
}: HeliusRpcOptions): HeliusClient => {
  const baseUrl = `https://${network}.helius-rpc.com/`;
  const rebateParam = rebateAddress ? `&rebate-address=${rebateAddress}` : "";
  const url = `${baseUrl}?api-key=${apiKey}${rebateParam}`;

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const transport = createDefaultRpcTransport({ url });
  const customTransport = async <TResponse>(
    request: Parameters<typeof transport>[0]
  ): Promise<TResponse> => {
    const payload = {
      ...(request.payload as Record<string, unknown>),
      id: "helius-sdk",
    };

    const modifiedRequest = {
      ...request,
      payload,
    };

    return transport(modifiedRequest) as Promise<TResponse>;
  };

  const baseRpc = createRpc({ api: solanaApi, transport: customTransport });
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

  defineLazyNamespace<HeliusClient, WebhookClient>(
    client,
    "webhooks",
    async () => {
      // This one import is enough since the sub-methods in the webhook client
      // are themselves lazily imported inside makeWebhookClient
      const { makeWebhookClient } = await import("../webhooks/client.js");
      return makeWebhookClient(apiKey);
    }
  );

  defineLazyNamespace<HeliusClient, EnhancedTxClientLazy>(
    client,
    "enhanced",
    async () => {
      const { makeEnhancedTxClientLazy } = await import("../enhanced");
      return makeEnhancedTxClientLazy(apiKey, network);
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
