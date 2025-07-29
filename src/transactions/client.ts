import type {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";
import { CreateSmartTransactionFn, CreateSmartTransactionWithTipFn, SendSmartTransactionFn } from "./types";
import { makeCreateSmartTransaction } from "./createSmartTransaction";
import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { makeSendSmartTransaction } from "./sendSmartTransaction";
import { makeCreateSmartTransactionWithTip } from "./createSmartTransactionWithTip";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
  createSmartTransaction: CreateSmartTransactionFn;
  createSmartTransactionWithTip: CreateSmartTransactionWithTipFn;
  sendSmartTransaction: SendSmartTransactionFn;
}

export const makeTxHelpersLazy = (
  rpc: Rpc<SolanaRpcApi>,
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn,
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
): TxHelpersLazy => {
  const getComputeUnits = makeGetComputeUnits(rpc);

  const { create } = makeCreateSmartTransaction({
    raw: rpc,
    getComputeUnits,
    getPriorityFeeEstimate,
  });

  const { create: createWithTip } = makeCreateSmartTransactionWithTip(create);

  const { send } = makeSendSmartTransaction({
    raw: rpc,
    rpcSubscriptions,
    createSmartTransaction: create,
  });

  return {
    getComputeUnits,
    createSmartTransaction: create,
    createSmartTransactionWithTip: createWithTip,
    sendSmartTransaction: send,
  };
};
