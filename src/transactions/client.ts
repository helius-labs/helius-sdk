import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeGetComputeUnits, type GetComputeUnitsFn } from "./getComputeUnits";

export interface TxHelpersLazy {
  getComputeUnits: GetComputeUnitsFn;
}

export const makeTxHelpersLazy = (rpc: Rpc<SolanaRpcApi>): TxHelpersLazy => ({
  getComputeUnits: makeGetComputeUnits(rpc),
});
