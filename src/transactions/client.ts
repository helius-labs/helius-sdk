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

/**
 * Transaction helper methods available on `helius.tx`.
 *
 * Provides utilities for simulating compute units, building smart
 * transactions with automatic priority fees, sending via the Helius
 * sender infrastructure, and polling for confirmations.
 */
export interface TxHelpersLazy {
  /** Simulate a transaction and return the compute units consumed. */
  getComputeUnits: GetComputeUnitsFn;
  /** Poll the RPC until a transaction reaches the desired confirmation status. */
  pollTransactionConfirmation: PollTransactionConfirmationFn;
  /** Submit a base-64 wire transaction and poll until confirmed. */
  broadcastTransaction: BroadcastTransactionFn;
  /** Build, simulate, and sign a smart transaction with automatic compute budget and priority fees. */
  createSmartTransaction: CreateSmartTransactionFn;
  /** Build, sign, send, and confirm a smart transaction in one call. */
  sendSmartTransaction: SendSmartTransactionFn;
  /** Build and send a transaction via the Helius sender infrastructure (SWQOS). */
  sendTransactionWithSender: SendTransactionWithSenderFn;
  /** Send a pre-signed transaction (any supported format). */
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

  const { send: sendTransaction } = makeSendTransaction(rpc);

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
