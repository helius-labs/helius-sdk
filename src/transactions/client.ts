import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";
import { CreateSmartTransactionFn } from "./types";
import { makeCreateSmartTransaction } from "./createSmartTransaction";
import { GetPriorityFeeEstimateFn } from "../rpc/methods/getPriorityFeeEstimate";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
  createSmartTransaction: CreateSmartTransactionFn;
}

export const makeTxHelpersLazy = (
  rpc: Rpc<SolanaRpcApi>,
  getPriorityFeeEstimate: GetPriorityFeeEstimateFn
): TxHelpersLazy => {
  const getComputeUnits = makeGetComputeUnits(rpc);
  const { create /*, send*/ } = makeCreateSmartTransaction({
    raw: rpc,
    getComputeUnits,
    getPriorityFeeEstimate,
  });

  return {
    getComputeUnits,
    createSmartTransaction: create,
    // sendSmartTransaction: send,
  };
};