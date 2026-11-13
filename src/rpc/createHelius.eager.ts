import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
} from "@solana/kit";
import { wrapAutoSend } from "./wrapAutoSend.js";
import { makeRpcCaller } from "./caller.js";
import {
  buildRpcUrl,
  resolveTransport,
  withSdkRequestId,
} from "./transport.js";

export type { TransportHook } from "./transport.js";
export type { RpcTransport } from "@solana/kit";
export { HeliusRpcError } from "./caller.js";
import { getSDKHeaders, type AllowedRpcHeaders } from "../http.js";

import { GetAssetFn, makeGetAsset } from "./methods/getAsset.js";
import { GetAssetBatchFn, makeGetAssetBatch } from "./methods/getAssetBatch.js";
import { GetAssetProofFn, makeGetAssetProof } from "./methods/getAssetProof.js";
import {
  GetAssetProofBatchFn,
  makeGetAssetProofBatch,
} from "./methods/getAssetProofBatch.js";
import {
  GetAssetsByAuthorityFn,
  makeGetAssetsByAuthority,
} from "./methods/getAssetsByAuthority.js";
import {
  GetAssetsByCreatorFn,
  makeGetAssetsByCreator,
} from "./methods/getAssetsByCreator.js";
import {
  GetAssetsByGroupFn,
  makeGetAssetsByGroup,
} from "./methods/getAssetsByGroup.js";
import {
  GetPriorityFeeEstimateFn,
  makeGetPriorityFeeEstimate,
} from "./methods/getPriorityFeeEstimate.js";

import {
  makeWebhookClientEager,
  type WebhookClient,
} from "../webhooks/client.eager.js";
import {
  makeWalletClientEager,
  type WalletClient,
} from "../wallet/client.eager.js";
import {
  makeParsedEventsClientEager,
  type ParsedEventsClient,
} from "../parsedEvents/client.eager.js";
import {
  makeAdminClientEager,
  type AdminClient,
} from "../admin/client.eager.js";
import {
  GetAssetsByOwnerFn,
  makeGetAssetsByOwner,
} from "./methods/getAssetsByOwner.js";
import {
  GetNftEditionsFn,
  makeGetNftEditions,
} from "./methods/getNftEditions.js";
import {
  GetSignaturesForAssetFn,
  makeGetSignaturesForAsset,
} from "./methods/getSignaturesForAsset.js";
import {
  GetTokenAccountsFn,
  makeGetTokenAccounts,
} from "./methods/getTokenAccounts.js";
import { makeSearchAssets, SearchAssetsFn } from "./methods/searchAssets.js";
import {
  EnhancedTxClient,
  makeEnhancedTxClientEager,
} from "../enhanced/client.eager.js";
import type { HeliusRpcAccess, HeliusRpcOptions } from "./types.js";
import {
  makeTxHelpersEager,
  TxHelpersEager,
} from "../transactions/client.eager.js";
import {
  GetProgramAccountsV2Fn,
  makeGetProgramAccountsV2,
} from "./methods/getProgramAccountsV2.js";
import {
  GetAllProgramAccountsFn,
  makeGetAllProgramAccounts,
} from "./methods/getAllProgramAccounts.js";
import {
  GetTokenAccountsByOwnerV2Fn,
  makeGetTokenAccountsByOwnerV2,
} from "./methods/getTokenAccountsByOwnerV2.js";
import {
  GetAllTokenAccountsByOwnerFn,
  makeGetAllTokenAccountsByOwner,
} from "./methods/getAllTokenAccountsByOwner.js";
import {
  GetTransactionsForAddressFn,
  makeGetTransactionsForAddress,
} from "./methods/getTransactionsForAddress.js";
import {
  GetTransfersByAddressFn,
  makeGetTransfersByAddress,
} from "./methods/getTransfersByAddress.js";
import {
  GetHistoricalAccountInfoFn,
  makeGetHistoricalAccountInfo,
} from "./methods/getHistoricalAccountInfo.js";
import {
  GetHistoricalTokenAccountsByOwnerFn,
  makeGetHistoricalTokenAccountsByOwner,
} from "./methods/getHistoricalTokenAccountsByOwner.js";

export interface HeliusClientEager extends HeliusRpcAccess {
  getAsset: GetAssetFn;
  getAssetBatch: GetAssetBatchFn;
  getAssetProof: GetAssetProofFn;
  getAssetProofBatch: GetAssetProofBatchFn;
  getAssetsByAuthority: GetAssetsByAuthorityFn;
  getAssetsByCreator: GetAssetsByCreatorFn;
  getAssetsByGroup: GetAssetsByGroupFn;
  getAssetsByOwner: GetAssetsByOwnerFn;
  getNftEditions: GetNftEditionsFn;
  getSignaturesForAsset: GetSignaturesForAssetFn;
  getTokenAccounts: GetTokenAccountsFn;
  searchAssets: SearchAssetsFn;

  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;

  getProgramAccountsV2: GetProgramAccountsV2Fn;
  getAllProgramAccounts: GetAllProgramAccountsFn;
  getTokenAccountsByOwnerV2: GetTokenAccountsByOwnerV2Fn;
  getAllTokenAccountsByOwner: GetAllTokenAccountsByOwnerFn;
  getTransactionsForAddress: GetTransactionsForAddressFn;
  getTransfersByAddress: GetTransfersByAddressFn;

  getHistoricalAccountInfo: GetHistoricalAccountInfoFn;
  getHistoricalTokenAccountsByOwner: GetHistoricalTokenAccountsByOwnerFn;

  webhooks: WebhookClient;

  /** @deprecated Use `parsedEvents` instead (mainnet-only; devnet can keep using this). The Enhanced Transactions API is in maintenance mode. */
  enhanced: EnhancedTxClient;

  parsedEvents: ParsedEventsClient;

  tx: TxHelpersEager;

  wallet: WalletClient;

  admin: AdminClient;
}

export const createHeliusEager = ({
  apiKey,
  network = "mainnet",
  rebateAddress,
  mevProtect,
  baseUrl,
  userAgent,
  transport: transportHook,
  parsedEventsUrl,
  parsedEventsTimeoutMs,
}: HeliusRpcOptions): HeliusClientEager => {
  const url = buildRpcUrl({
    baseUrl,
    network,
    apiKey,
    rebateAddress,
    mevProtect,
  });

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const transport = resolveTransport(
    withSdkRequestId(
      createDefaultRpcTransport({
        url,
        headers: getSDKHeaders(userAgent) as AllowedRpcHeaders,
      })
    ),
    transportHook
  );

  const baseRpc = createRpc({ api: solanaApi, transport });
  const raw = wrapAutoSend(baseRpc);

  const call = makeRpcCaller(transport);

  return {
    kitRpc: baseRpc,
    raw,

    // DAS
    getAsset: makeGetAsset(call),
    getAssetBatch: makeGetAssetBatch(call),
    getAssetProof: makeGetAssetProof(call),
    getAssetProofBatch: makeGetAssetProofBatch(call),
    getAssetsByAuthority: makeGetAssetsByAuthority(call),
    getAssetsByCreator: makeGetAssetsByCreator(call),
    getAssetsByGroup: makeGetAssetsByGroup(call),
    getAssetsByOwner: makeGetAssetsByOwner(call),
    getNftEditions: makeGetNftEditions(call),
    getTokenAccounts: makeGetTokenAccounts(call),
    getSignaturesForAsset: makeGetSignaturesForAsset(call),
    searchAssets: makeSearchAssets(call),

    // Priority Fee API
    getPriorityFeeEstimate: makeGetPriorityFeeEstimate(call),

    // V2 methods
    getProgramAccountsV2: makeGetProgramAccountsV2(call),
    getAllProgramAccounts: makeGetAllProgramAccounts(call),
    getTokenAccountsByOwnerV2: makeGetTokenAccountsByOwnerV2(call),
    getAllTokenAccountsByOwner: makeGetAllTokenAccountsByOwner(call),
    getTransactionsForAddress: makeGetTransactionsForAddress(call),
    getTransfersByAddress: makeGetTransfersByAddress(call),
    getHistoricalAccountInfo: makeGetHistoricalAccountInfo(call),
    getHistoricalTokenAccountsByOwner:
      makeGetHistoricalTokenAccountsByOwner(call),

    // Webhooks
    get webhooks() {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
        );
      }
      return makeWebhookClientEager(apiKey, userAgent);
    },

    // Enhanced Transactions
    get enhanced() {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
        );
      }
      return makeEnhancedTxClientEager(apiKey, network, userAgent, baseUrl);
    },

    // Parsed Events
    get parsedEvents() {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use Parsed Events. Provide apiKey in createHelius() options."
        );
      }
      return makeParsedEventsClientEager(
        apiKey,
        { network, baseUrl, parsedEventsUrl, parsedEventsTimeoutMs },
        userAgent
      );
    },

    // Transaction helpers
    tx: makeTxHelpersEager(baseRpc),

    // Wallet API
    get wallet() {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use the Wallet API. Provide apiKey in createHelius() options."
        );
      }
      return makeWalletClientEager(apiKey, userAgent);
    },

    // Admin API
    get admin() {
      if (!apiKey) {
        throw new Error(
          "An API key is required to use the Admin API. Provide apiKey in createHelius() options."
        );
      }
      return makeAdminClientEager(apiKey, userAgent);
    },
  };
};
