import { Address, TransactionSigner } from "@solana/kit";
import { getDeactivateInstruction } from "@solana-program/stake";
import { SYSVAR_CLOCK } from "./types";

export const makeGetUnstakeInstruction =
  () => (owner: TransactionSigner<string> | Address, stakeAccount: Address) =>
    getDeactivateInstruction({
      stake: stakeAccount,
      stakeAuthority: owner as any,
      clockSysvar: SYSVAR_CLOCK,
    });
