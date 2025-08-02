import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeCreateStakeTransaction } from "./createStakeTransaction";
import {
  GetHeliusStakeAccountsFn,
  GetWithdrawableAmountFn,
  type CreateStakeTransactionFn,
  type createUnstakeTransactionFn,
  type CreateWithdrawTransactionFn,
} from "./types";
import { makeCreateUnstakeTransaction } from "./createUnstakeTransaction";
import { makeCreateWithdrawTransaction } from "./createWithdrawTransaction";
import { makeGetHeliusStakeAccounts } from "./getHeliusStakeAccounts";
import { makeGetWithdrawableAmount } from "./getWithdrawableAmount";

export interface StakeClientLazy {
  createStakeTransaction: CreateStakeTransactionFn;
  createUnstakeTransaction: createUnstakeTransactionFn;
  createWithdrawTransaction: CreateWithdrawTransactionFn;
  getHeliusStakeAccounts: GetHeliusStakeAccountsFn;
  getWithdrawableAmount: GetWithdrawableAmountFn;
}

export const makeStakeClientLazy = (
  rpc: Rpc<SolanaRpcApi>
): StakeClientLazy => {
  const createStakeTransaction = makeCreateStakeTransaction({ rpc });
  const createUnstakeTransaction = makeCreateUnstakeTransaction({ rpc });
  const createWithdrawTransaction = makeCreateWithdrawTransaction({ rpc });
  const getHeliusStakeAccounts = makeGetHeliusStakeAccounts({ rpc });
  const getWithdrawableAmount = makeGetWithdrawableAmount({ rpc });

  return {
    createStakeTransaction,
    createUnstakeTransaction,
    createWithdrawTransaction,
    getHeliusStakeAccounts,
    getWithdrawableAmount,
  };
};
