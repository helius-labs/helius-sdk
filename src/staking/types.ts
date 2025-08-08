import {
  getInitializeInstruction,
  getDelegateStakeInstruction,
} from "@solana-program/stake";
import { getCreateAccountInstruction } from "@solana-program/system";
import { type Address, KeyPairSigner, TransactionSigner } from "@solana/kit";

export const STAKE_PROGRAM_ID: Address =
  "Stake11111111111111111111111111111111111111" as Address;

export const SYSVAR_CLOCK =
  "SysvarC1ock11111111111111111111111111111111" as Address;

export const SYSVAR_STAKE_HISTORY =
  "SysvarStakeHistory1111111111111111111111111" as Address;

export const UNUSED_STAKE_CONFIG_ACC =
  "StakeConfig11111111111111111111111111111111" as Address;

export const HELIUS_VALIDATOR_ID: Address =
  "he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk" as Address;

// Deactivation epoch check (active stake accounts are set to u64's max value)
export const U64_MAX = "18446744073709551615" as unknown as BigInt;

// The size of a stake account
export const STAKE_STATE_LEN = 200;

export const LAMPORTS_PER_SOL_BIGINT = "1_000_000_000" as unknown as BigInt;

export type CreateStakeTransactionFn = (
  owner: KeyPairSigner<string>,
  amountSol: number
) => Promise<{
  serializedTx: string;
  stakeAccountPubkey: Address;
}>;

export type createUnstakeTransactionFn = (
  ownerSigner: KeyPairSigner<string>,
  stakeAccount: Address
) => Promise<{ serializedTx: string }>;

export type CreateWithdrawTransactionFn = (
  withdrawAuthority: KeyPairSigner<string>,
  stakeAccount: Address,
  destination: Address,
  lamports: number | bigint
) => Promise<{ serializedTx: string }>;

export type GetHeliusStakeAccountsFn = (
  wallet: string | Address
) => Promise<any[]>;

export type GetWithdrawableAmountFn = (
  stakeAccount: Address | string,
  includeRentExempt?: boolean
) => Promise<number>;

export interface StakeInstructionsResult {
  instructions: ReadonlyArray<
    ReturnType<
      | typeof getCreateAccountInstruction
      | typeof getInitializeInstruction
      | typeof getDelegateStakeInstruction
    >
  >;
  stakeAccount: TransactionSigner<string>;
}

export type GetStakeInstructionsFn = (
  owner: TransactionSigner<string>,
  amountSol: number
) => Promise<StakeInstructionsResult>;

export type GetUnstakeInstructionFn = (
  owner: Address,
  stakeAccount: Address
) => any;

export type GetWithdrawIxFn = (
  owner: Address,
  stakeAccount: Address,
  destination: Address,
  lamports: number | bigint
) => any;
