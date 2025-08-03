import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { makeCreateStakeTransaction } from "./createStakeTransaction";
import {
  GetHeliusStakeAccountsFn,
  GetStakeInstructionsFn,
  GetUnstakeInstructionFn,
  GetWithdrawableAmountFn,
  GetWithdrawIxFn,
  type CreateStakeTransactionFn,
  type createUnstakeTransactionFn,
  type CreateWithdrawTransactionFn,
} from "./types";
import { makeCreateUnstakeTransaction } from "./createUnstakeTransaction";
import { makeCreateWithdrawTransaction } from "./createWithdrawTransaction";
import { makeGetHeliusStakeAccounts } from "./getHeliusStakeAccounts";
import { makeGetWithdrawableAmount } from "./getWithdrawableAmount";
import { makeGetStakeInstructions } from "./getStakeInstructions";
import { makeGetUnstakeInstruction } from "./getUnstakeInstruction";
import { makeGetWithdrawInstruction } from "./getWithdrawInstruction";

export interface StakeClientLazy {
  createStakeTransaction: CreateStakeTransactionFn;
  createUnstakeTransaction: createUnstakeTransactionFn;
  createWithdrawTransaction: CreateWithdrawTransactionFn;
  getHeliusStakeAccounts: GetHeliusStakeAccountsFn;
  getWithdrawableAmount: GetWithdrawableAmountFn;
  getStakeInstructions: GetStakeInstructionsFn;
  getUnstakeInstruction: GetUnstakeInstructionFn;
  getWithdrawInstruction: GetWithdrawIxFn;
}

export const makeStakeClientLazy = (
  rpc: Rpc<SolanaRpcApi>
): StakeClientLazy => {
  const createStakeTransaction = makeCreateStakeTransaction({ rpc });
  const createUnstakeTransaction = makeCreateUnstakeTransaction({ rpc });
  const createWithdrawTransaction = makeCreateWithdrawTransaction({ rpc });
  const getHeliusStakeAccounts = makeGetHeliusStakeAccounts({ rpc });
  const getWithdrawableAmount = makeGetWithdrawableAmount({ rpc });
  const getStakeInstructions =     makeGetStakeInstructions({ rpc });
  const getUnstakeInstruction =    makeGetUnstakeInstruction();
  const getWithdrawInstruction =   makeGetWithdrawInstruction();

  return {
    createStakeTransaction,
    createUnstakeTransaction,
    createWithdrawTransaction,
    getHeliusStakeAccounts,
    getWithdrawableAmount,
    getStakeInstructions,
    getUnstakeInstruction,
    getWithdrawInstruction,
  };
};
