import {
  generateKeyPairSigner,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
} from "@solana/kit";

import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeInstruction,
  getDelegateStakeInstruction,
} from "@solana-program/stake";

import {
  HELIUS_VALIDATOR_ID,
  STAKE_PROGRAM_ID,
  STAKE_STATE_LEN,
  StakeInstructionsResult,
  SYSVAR_CLOCK,
  SYSVAR_STAKE_HISTORY,
  UNUSED_STAKE_CONFIG_ACC,
} from "./types";

export const makeGetStakeInstructions = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (
    owner: TransactionSigner<string>,
    amountSol: number
  ): Promise<StakeInstructionsResult> => {
    const rentExempt = await rpc
      .getMinimumBalanceForRentExemption(BigInt(STAKE_STATE_LEN))
      .send();

    const lamports = rentExempt + BigInt(Math.round(amountSol * 1_000_000_000));
    const stakeAccount = await generateKeyPairSigner();

    const createIx = getCreateAccountInstruction({
      payer: owner,
      newAccount: stakeAccount,
      lamports,
      space: BigInt(STAKE_STATE_LEN),
      programAddress: STAKE_PROGRAM_ID,
    });

    const initIx = getInitializeInstruction({
      stake: stakeAccount.address,
      arg0: { staker: owner.address, withdrawer: owner.address },
      arg1: { unixTimestamp: 0n, epoch: 0n, custodian: owner.address },
    });

    const delegateIx = getDelegateStakeInstruction({
      stake: stakeAccount.address,
      vote: HELIUS_VALIDATOR_ID,
      clockSysvar: SYSVAR_CLOCK,
      stakeHistory: SYSVAR_STAKE_HISTORY,
      unused: UNUSED_STAKE_CONFIG_ACC,
      stakeAuthority: owner,
    });

    return {
      instructions: [createIx, initIx, delegateIx],
      stakeAccount,
    };
  };
};
