import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeCreateStakeTransaction } from "./createStakeTransaction";
import { CreateStakeTransactionFn, createUnstakeTransactionFn } from "./types";
import { makeCreateUnstakeTransaction } from "./createUnstakeTransaction";

export interface StakeClientLazy {
  createStakeTransaction: CreateStakeTransactionFn;
  createUnstakeTransaction: createUnstakeTransactionFn;
}


export const makeStakeClientLazy = (rpc: Rpc<SolanaRpcApi>): StakeClientLazy => {
  const createStakeTransaction = makeCreateStakeTransaction({ rpc });
  const createUnstakeTransaction = makeCreateUnstakeTransaction({ rpc });

  return {
    createStakeTransaction,
    createUnstakeTransaction
  };
};
