import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeCreateStakeTransaction } from "./createStakeTransaction";
import { CreateStakeTransactionFn } from "./types";

export interface StakeClientLazy {
  createStakeTransaction: CreateStakeTransactionFn;
}


export const makeStakeClientLazy = (rpc: Rpc<SolanaRpcApi>): StakeClientLazy => {
  const createStakeTransaction = makeCreateStakeTransaction({ rpc });

  return {
    createStakeTransaction,
  };
};
