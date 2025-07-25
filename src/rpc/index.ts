import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
  type Rpc,
  type SolanaRpcApi,
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

interface HeliusRpcOptions {
  apiKey: string;
  network?: "mainnet" | "devnet";
  autoSend?: boolean;
}

export interface HeliusClient {
  raw: Rpc<SolanaRpcApi>;

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

  // Priority Fee API
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;

  // Webhooks
  webhooks: {
    create(params: CreateWebhookRequest): Promise<Webhook>;
    get(webhookID: string): Promise<Webhook>;
    getAll(): Promise<Webhook[]>;
    update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
    delete(webhookID: string): Promise<boolean>;
  } & WebhookClient;
}

export const createHelius = ({
  apiKey,
  network = "mainnet",
  autoSend = true,
}: HeliusRpcOptions): HeliusClient => {
  const baseUrl = `https://${network}.helius-rpc.com/`;
  const url = `${baseUrl}?api-key=${apiKey}`;

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const transport = createDefaultRpcTransport({ url });

  let raw = createRpc({ api: solanaApi, transport }) as Rpc<SolanaRpcApi>;
  if (autoSend) raw = wrapAutoSend(raw);

  // Lightweight, no-PendingRpcRequest caller for custom DAS/webhook methods
  const call = makeRpcCaller(transport);

  // The object we’ll populate lazily
  const client: any = { raw };

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

  return client as HeliusClient;
};
