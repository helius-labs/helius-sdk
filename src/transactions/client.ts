import type {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";
import {
  SendTransactionFn,
  SendTransactionWithSenderFn,
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
import { makeCreateSmartTransactionWithTip } from "./createSmartTransactionWithTip";
import { makeSendTransactionWithSender } from "./sendTransactionWithSender";
import { makeSendTransaction } from "./sendTransaction";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
  pollTransactionConfirmation: PollTransactionConfirmationFn;
  broadcastTransaction: BroadcastTransactionFn;
  createSmartTransaction: CreateSmartTransactionFn;
  sendSmartTransaction: SendSmartTransactionFn;
  sendTransactionWithSender: SendTransactionWithSenderFn;
  sendTransaction: SendTransactionFn;
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

  const { create: createSmartTransactionWithTip } =
    makeCreateSmartTransactionWithTip(create);

  const pollTransactionConfirmation = makePollTransactionConfirmation(rpc);

  const broadcastTransaction = broadcastTransactionFactory(rpc);

  const { send } = makeSendSmartTransaction({
    raw: rpc,
    rpcSubscriptions,
    createSmartTransaction: create,
  });

  const { send: sendWithSender } = makeSendTransactionWithSender({
    raw: rpc,
    createSmartTransactionWithTip,
  });

  const  { send: sendTransaction } = makeSendTransaction(rpc);

  return {
    getComputeUnits,
    pollTransactionConfirmation,
    broadcastTransaction,
    createSmartTransaction: create,
    sendSmartTransaction: send,
    sendTransactionWithSender: sendWithSender,
    sendTransaction,
  };
};
