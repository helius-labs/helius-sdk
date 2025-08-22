import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";

export interface TxHelpersEager {
  getComputeUnits: GetComputeUnitsFn;
}

export const makeTxHelpersEager = (raw: Rpc<SolanaRpcApi>): TxHelpersEager => {
  return {
    getComputeUnits: makeGetComputeUnits(raw),
  };
};
