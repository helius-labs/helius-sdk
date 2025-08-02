import { address, Address, KeyPairSigner } from "@solana/kit";

export const STAKE_PROGRAM_ID: Address = address(
  "Stake11111111111111111111111111111111111111"
);

export const SYSVAR_CLOCK = address(
  "SysvarC1ock11111111111111111111111111111111"
);
export const SYSVAR_STAKE_HISTORY = address(
  "SysvarStakeHistory1111111111111111111111111"
);
export const UNUSED_STAKE_CONFIG_ACC = address(
  "StakeConfig11111111111111111111111111111111"
);

export const HELIUS_VALIDATOR_ID: Address = address(
  "he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk"
);

// The size of a stake account
export const STAKE_STATE_LEN = 200;

export const LAMPORTS_PER_SOL_BIGINT = BigInt(1_000_000_000);

export type CreateStakeTransactionFn = (
  owner: KeyPairSigner<string>,
  amountSol: number,
) => Promise<{
  serializedTx: string;
  stakeAccountPubkey: Address;
}>;

export type createUnstakeTransactionFn = (
  ownerSigner: KeyPairSigner<string>,
  stakeAccount: Address,
) => Promise<{ serializedTx: string }>
