import {
  Address,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  pipe,
  Rpc,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  SolanaRpcApi,
  TransactionSigner,
} from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getDelegateStakeInstruction,
  getInitializeInstruction,
} from "@solana-program/stake";

import {
  HELIUS_VALIDATOR_ID,
  STAKE_PROGRAM_ID,
  STAKE_STATE_LEN,
  SYSVAR_CLOCK,
  SYSVAR_STAKE_HISTORY,
  UNUSED_STAKE_CONFIG_ACC,
} from "./types";

export const makeCreateStakeTransaction = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (
    ownerSigner: TransactionSigner<string>,
    amountSol: number,
  ): Promise<{ serializedTx: string; stakeAccountPubkey: Address }> => {
    const rentExempt = await rpc
      .getMinimumBalanceForRentExemption(BigInt(STAKE_STATE_LEN))
      .send();

    const userLamports = BigInt(Math.round(amountSol * 1_000_000_000));
    const lamports     = rentExempt + userLamports;

    const stakeAccount = await generateKeyPairSigner();

    const createIx = getCreateAccountInstruction({
      payer:      ownerSigner,   
      newAccount: stakeAccount,   
      lamports,
      space:      BigInt(STAKE_STATE_LEN),
      programAddress: STAKE_PROGRAM_ID,
    });

    const initializeIx = getInitializeInstruction({
      stake: stakeAccount.address,
      arg0:  { staker: ownerSigner.address, withdrawer: ownerSigner.address },
      arg1:  { unixTimestamp: 0n, epoch: 0n, custodian: ownerSigner.address },
    });

    const delegateIx = getDelegateStakeInstruction({
      stake:         stakeAccount.address,
      vote:          HELIUS_VALIDATOR_ID,
      clockSysvar:   SYSVAR_CLOCK,
      stakeHistory:  SYSVAR_STAKE_HISTORY,
      unused:        UNUSED_STAKE_CONFIG_ACC,
      stakeAuthority: ownerSigner,   
    });

    const { value: blockheight } = await rpc.getLatestBlockhash().send();

    const msg = pipe(
      createTransactionMessage({ version: 0 }),
      m => setTransactionMessageFeePayer(ownerSigner.address, m),
      m => setTransactionMessageLifetimeUsingBlockhash(blockheight, m),
      m => appendTransactionMessageInstructions(
        [createIx, initializeIx, delegateIx],
        m,
      ),
    );

    const signedTx = await signTransactionMessageWithSigners(
      msg
    );
    const serializedTx = getBase64EncodedWireTransaction(signedTx);

    return {
      serializedTx,
      stakeAccountPubkey: stakeAccount.address,
    };
  };
};
