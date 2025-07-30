import type {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";
import {
  type BroadcastTransactionFn,
  type CreateSmartTransactionFn,
  type PollTransactionConfirmationFn,
  type SendSmartTransactionFn,
} from "./types";
import { makeCreateSmartTransaction } from "./createSmartTransaction";
import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";
import { makeSendSmartTransaction } from "./sendSmartTransaction";
import { makePollTransactionConfirmation } from "./pollTransactionConfirmation";
import { broadcastTransactionFactory } from "./broadcastTransaction";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
  pollTransactionConfirmation: PollTransactionConfirmationFn;
  broadcastTransaction: BroadcastTransactionFn;
  createSmartTransaction: CreateSmartTransactionFn;
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

  const pollTransactionConfirmation = makePollTransactionConfirmation(rpc);

  const broadcastTransaction = broadcastTransactionFactory(rpc);

  const { send } = makeSendSmartTransaction({
    raw: rpc,
    rpcSubscriptions,
    createSmartTransaction: create,
  });

  return {
    getComputeUnits,
    pollTransactionConfirmation,
    broadcastTransaction,
    createSmartTransaction: create,
    sendSmartTransaction: send,
  };
};
