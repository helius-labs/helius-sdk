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

/**
 * Client for Helius native staking operations. All delegations
 * target the Helius validator (`he1ius...`).
 */
export interface StakeClientLazy {
  /** Create a signed stake transaction delegating to the Helius validator. */
  createStakeTransaction: CreateStakeTransactionFn;
  /** Create a signed deactivation (unstake) transaction. */
  createUnstakeTransaction: createUnstakeTransactionFn;
  /** Create a signed withdrawal transaction for a deactivated stake account. */
  createWithdrawTransaction: CreateWithdrawTransactionFn;
  /** Fetch all stake accounts delegated to the Helius validator for a wallet. */
  getHeliusStakeAccounts: GetHeliusStakeAccountsFn;
  /** Get the withdrawable lamport amount for a deactivated stake account. */
  getWithdrawableAmount: GetWithdrawableAmountFn;
  /** Build the raw instructions to create and delegate a stake account. */
  getStakeInstructions: GetStakeInstructionsFn;
  /** Build a deactivation (unstake) instruction. */
  getUnstakeInstruction: GetUnstakeInstructionFn;
  /** Build a withdrawal instruction. */
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
  const getStakeInstructions = makeGetStakeInstructions({ rpc });
  const getUnstakeInstruction = makeGetUnstakeInstruction();
  const getWithdrawInstruction = makeGetWithdrawInstruction();

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
