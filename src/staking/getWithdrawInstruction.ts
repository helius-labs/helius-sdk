import { Address, TransactionSigner } from "@solana/kit";
import { getWithdrawInstruction } from "@solana-program/stake";
import { SYSVAR_CLOCK, SYSVAR_STAKE_HISTORY } from "./types";

export const makeGetWithdrawInstruction =
  () =>
  (
    owner: TransactionSigner<string> | Address,
    stakeAccount: Address,
    destination: Address,
    lamports: number | bigint
  ) =>
    getWithdrawInstruction({
      stake: stakeAccount,
      recipient: destination,
      clockSysvar: SYSVAR_CLOCK,
      stakeHistory: SYSVAR_STAKE_HISTORY,
      withdrawAuthority: owner as any,
      args: lamports,
    });
