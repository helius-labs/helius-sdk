import type { Rpc, RpcSubscriptions, SolanaRpcApi, SolanaRpcSubscriptionsApi } from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";
import { CreateSmartTransactionFn, SendSmartTransactionFn } from "./types";
import { makeCreateSmartTransaction } from "./createSmartTransaction";
import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { makeSendSmartTransaction } from "./sendSmartTransaction";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
  createSmartTransaction: CreateSmartTransactionFn;
  sendSmartTransaction: SendSmartTransactionFn;
}

export const makeTxHelpersLazy = (
  rpc: Rpc<SolanaRpcApi>,
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn,
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>,
): TxHelpersLazy => {
  const getComputeUnits = makeGetComputeUnits(rpc);
  const { create } = makeCreateSmartTransaction({
    raw: rpc,
    getComputeUnits,
    getPriorityFeeEstimate,
  });

  const { send } = makeSendSmartTransaction({
    raw: rpc,
    rpcSubscriptions,
    createSmartTransaction: create,
  });

  return {
    getComputeUnits,
    createSmartTransaction: create,
    sendSmartTransaction: send,
  };
};