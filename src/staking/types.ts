import {
  getInitializeInstruction,
  getDelegateStakeInstruction,
} from "@solana-program/stake";
import { getCreateAccountInstruction } from "@solana-program/system";
import { type Address, KeyPairSigner, TransactionSigner } from "@solana/kit";

/** Native Stake program address. */
export const STAKE_PROGRAM_ID: Address =
  "Stake11111111111111111111111111111111111111" as Address;

/** Sysvar Clock address. */
export const SYSVAR_CLOCK =
  "SysvarC1ock11111111111111111111111111111111" as Address;

/** Sysvar Stake History address. */
export const SYSVAR_STAKE_HISTORY =
  "SysvarStakeHistory1111111111111111111111111" as Address;

/** Unused stake config account (required by legacy instructions). */
export const UNUSED_STAKE_CONFIG_ACC =
  "StakeConfig11111111111111111111111111111111" as Address;

/** Helius validator vote account address. */
export const HELIUS_VALIDATOR_ID: Address =
  "he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk" as Address;

/** Max u64 value — active stake accounts have their deactivation epoch set to this. */
export const U64_MAX = "18446744073709551615" as unknown as bigint;

/** Size of a stake account in bytes. */
export const STAKE_STATE_LEN = 200;

/** Lamports per SOL as a BigInt-compatible value. */
export const LAMPORTS_PER_SOL_BIGINT = "1_000_000_000" as unknown as bigint;

/** Create a signed stake transaction delegating to the Helius validator. Returns the serialized tx and new stake account pubkey. */
export type CreateStakeTransactionFn = (
  owner: KeyPairSigner<string>,
  amountSol: number
) => Promise<{
  serializedTx: string;
  stakeAccountPubkey: Address;
}>;

/** Create a signed deactivation (unstake) transaction. Returns the serialized tx. */
export type createUnstakeTransactionFn = (
  ownerSigner: KeyPairSigner<string>,
  stakeAccount: Address
) => Promise<{ serializedTx: string }>;

/** Create a signed withdrawal transaction. Returns the serialized tx. */
export type CreateWithdrawTransactionFn = (
  withdrawAuthority: KeyPairSigner<string>,
  stakeAccount: Address,
  destination: Address,
  lamports: number | bigint
) => Promise<{ serializedTx: string }>;

/** Fetch all stake accounts delegated to the Helius validator for a given wallet. */
export type GetHeliusStakeAccountsFn = (
  wallet: string | Address
) => Promise<any[]>;

/** Get the withdrawable lamport amount for a stake account. */
export type GetWithdrawableAmountFn = (
  stakeAccount: Address | string,
  includeRentExempt?: boolean
) => Promise<number>;

/** Result from `getStakeInstructions` — the instructions and generated stake account signer. */
export interface StakeInstructionsResult {
  /** Instructions to create, initialize, and delegate the stake account. */
  instructions: ReadonlyArray<
    ReturnType<
      | typeof getCreateAccountInstruction
      | typeof getInitializeInstruction
      | typeof getDelegateStakeInstruction
    >
  >;
  /** The generated stake account signer (keypair). */
  stakeAccount: TransactionSigner<string>;
}

/** Build the instructions needed to create and delegate a stake account. */
export type GetStakeInstructionsFn = (
  owner: TransactionSigner<string>,
  amountSol: number
) => Promise<StakeInstructionsResult>;

/** Build a deactivation (unstake) instruction. */
export type GetUnstakeInstructionFn = (
  owner: Address,
  stakeAccount: Address
) => any;

/** Build a withdrawal instruction. */
export type GetWithdrawIxFn = (
  owner: Address,
  stakeAccount: Address,
  destination: Address,
  lamports: number | bigint
) => any;
