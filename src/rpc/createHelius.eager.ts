import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
  Rpc,
  SolanaRpcApi,
} from "@solana/kit";
import { wrapAutoSend } from "./wrapAutoSend";
import { makeRpcCaller } from "./caller";

import { GetAssetFn, makeGetAsset } from "./methods/getAsset";
import { GetAssetBatchFn, makeGetAssetBatch } from "./methods/getAssetBatch";
import { GetAssetProofFn, makeGetAssetProof } from "./methods/getAssetProof";
import {
  GetAssetProofBatchFn,
  makeGetAssetProofBatch,
} from "./methods/getAssetProofBatch";
import {
  GetAssetsByAuthorityFn,
  makeGetAssetsByAuthority,
} from "./methods/getAssetsByAuthority";
import {
  GetAssetsByCreatorFn,
  makeGetAssetsByCreator,
} from "./methods/getAssetsByCreator";
import {
  GetAssetsByGroupFn,
  makeGetAssetsByGroup,
} from "./methods/getAssetsByGroup";
import {
  GetPriorityFeeEstimateFn,
  makeGetPriorityFeeEstimate,
} from "./methods/getPriorityFeeEstimate";

import {
  makeWebhookClientEager,
  type WebhookClient,
} from "../webhooks/client.eager";
import {
  GetAssetsByOwnerFn,
  makeGetAssetsByOwner,
} from "./methods/getAssetsByOwner";
import { GetNftEditionsFn, makeGetNftEditions } from "./methods/getNftEditions";
import {
  GetSignaturesForAssetFn,
  makeGetSignaturesForAsset,
} from "./methods/getSignaturesForAsset";
import {
  GetTokenAccountsFn,
  makeGetTokenAccounts,
} from "./methods/getTokenAccounts";
import { makeSearchAssets, SearchAssetsFn } from "./methods/searchAssets";
import {
  EnhancedTxClient,
  makeEnhancedTxClientEager,
} from "../enhanced/client.eager";
import { ResolvedHeliusRpcApi } from "./heliusRpcApi";
import {
  makeTxHelpersEager,
  TxHelpersEager,
} from "../transactions/client.eager";
import {
  GetProgramAccountsV2Fn,
  makeGetProgramAccountsV2,
} from "./methods/getProgramAccountsV2";
import {
  GetAllProgramAccountsFn,
  makeGetAllProgramAccounts,
} from "./methods/getAllProgramAccounts";
import {
  GetTokenAccountsByOwnerV2Fn,
  makeGetTokenAccountsByOwnerV2,
} from "./methods/getTokenAccountsByOwnerV2";
import {
  GetAllTokenAccountsByOwnerFn,
  makeGetAllTokenAccountsByOwner,
} from "./methods/getAllTokenAccountsByOwner";

export interface HeliusClientEager {
  raw: ResolvedHeliusRpcApi;

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

  webhooks: WebhookClient;

  enhanced: EnhancedTxClient;

  tx: TxHelpersEager;
}

export type HeliusRpcOptions = {
  apiKey: string;
  network?: "mainnet" | "devnet";
};

export const createHeliusEager = ({
  apiKey,
  network = "mainnet",
}: HeliusRpcOptions): HeliusClientEager => {
  const url = `https://${network}.helius-rpc.com/?api-key=${apiKey}`;

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const transport = createDefaultRpcTransport({ url });

  let baseRpc = createRpc({ api: solanaApi, transport });
  // Cast to any because I cba to go down this type rabbit hole
  const raw = wrapAutoSend(baseRpc) as any;

  const call = makeRpcCaller(transport);

  return {
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

    // Webhooks
    webhooks: makeWebhookClientEager(apiKey),

    // Enhanced Transactions
    enhanced: makeEnhancedTxClientEager(apiKey),

    // Transaction helpers
    tx: makeTxHelpersEager(baseRpc as unknown as Rpc<SolanaRpcApi>),
  };
};
