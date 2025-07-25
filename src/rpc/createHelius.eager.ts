import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
  type Rpc,
  type SolanaRpcApi,
} from '@solana/kit';
import { wrapAutoSend } from './wrapAutoSend';
import { makeRpcCaller } from './caller';

import { GetAssetFn, makeGetAsset } from './methods/getAsset';
import { GetAssetBatchFn, makeGetAssetBatch } from './methods/getAssetBatch';
import { GetAssetProofFn, makeGetAssetProof } from './methods/getAssetProof';
import { GetAssetProofBatchFn, makeGetAssetProofBatch } from './methods/getAssetProofBatch';
import { GetAssetsByAuthorityFn, makeGetAssetsByAuthority } from './methods/getAssetsByAuthority';
import { GetAssetsByCreatorFn, makeGetAssetsByCreator } from './methods/getAssetsByCreator';
import { GetAssetsByGroupFn, makeGetAssetsByGroup } from './methods/getAssetsByGroup';
import { GetPriorityFeeEstimateFn, makeGetPriorityFeeEstimate } from './methods/getPriorityFeeEstimate';

import { makeWebhookClientEager, type WebhookClient } from '../webhooks/client.eager';
import { GetAssetsByOwnerFn, makeGetAssetsByOwner } from './methods/getAssetsByOwner';
import { GetNftEditionsFn, makeGetNftEditions } from './methods/getNftEditions';
import { GetSignaturesForAssetFn, makeGetSignaturesForAsset } from './methods/getSignaturesForAsset';
import { GetTokenAccountsFn, makeGetTokenAccounts } from './methods/getTokenAccounts';

export interface HeliusClientEager {
  raw: Rpc<SolanaRpcApi>;

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
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn;

  webhooks: WebhookClient;
}

export type HeliusRpcOptions = {
  apiKey: string;
  network?: 'mainnet' | 'devnet';
  autoSend?: boolean;
};

export const createHeliusEager = ({
  apiKey,
  network = 'mainnet',
  autoSend = true,
}: HeliusRpcOptions): HeliusClientEager => {
  const url = `https://${network}.helius-rpc.com/?api-key=${apiKey}`;

  const solanaApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
  const transport = createDefaultRpcTransport({ url });

  let raw = createRpc({ api: solanaApi, transport }) as Rpc<SolanaRpcApi>;
  if (autoSend) raw = wrapAutoSend(raw);

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

    // Priority Fee API
    getPriorityFeeEstimate: makeGetPriorityFeeEstimate(call),

    // Webhooks
    webhooks: makeWebhookClientEager(apiKey),
  };
};
