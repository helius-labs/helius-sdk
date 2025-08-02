import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeCreateStakeTransaction } from "./createStakeTransaction";
import {
  type CreateStakeTransactionFn,
  type createUnstakeTransactionFn,
  type CreateWithdrawTransactionFn,
} from "./types";
import { makeCreateUnstakeTransaction } from "./createUnstakeTransaction";
import { makeCreateWithdrawTransaction } from "./createWithdrawTransaction";

export interface StakeClientLazy {
  createStakeTransaction: CreateStakeTransactionFn;
  createUnstakeTransaction: createUnstakeTransactionFn;
  createWithdrawTransaction: CreateWithdrawTransactionFn;
}

export const makeStakeClientLazy = (
  rpc: Rpc<SolanaRpcApi>
): StakeClientLazy => {
  const createStakeTransaction = makeCreateStakeTransaction({ rpc });
  const createUnstakeTransaction = makeCreateUnstakeTransaction({ rpc });
  const createWithdrawTransaction = makeCreateWithdrawTransaction({ rpc });

  return {
    createStakeTransaction,
    createUnstakeTransaction,
    createWithdrawTransaction,
  };
};
