import {
  Address,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  KeyPairSigner,
  pipe,
  Rpc,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  SolanaRpcApi,
} from "@solana/kit";
import { getWithdrawInstruction } from "@solana-program/stake";
import { SYSVAR_CLOCK, SYSVAR_STAKE_HISTORY } from "./types";

export const makeCreateWithdrawTransaction = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (
    withdrawAuthority: KeyPairSigner<string>,
    stakeAccount: Address,
    destination: Address,
    lamports: number | bigint
  ): Promise<{ serializedTx: string }> => {
    const withdrawIx = getWithdrawInstruction({
      stake: stakeAccount,
      recipient: destination,
      clockSysvar: SYSVAR_CLOCK,
      stakeHistory: SYSVAR_STAKE_HISTORY,
      withdrawAuthority,
      args: lamports,
    });

    const { value: blockHeight } = await rpc.getLatestBlockhash().send();

    const msg = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayer(withdrawAuthority.address, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(blockHeight, m),
      (m) => appendTransactionMessageInstructions([withdrawIx], m)
    );

    const signedTx = await signTransactionMessageWithSigners(msg);
    const serializedTx = getBase64EncodedWireTransaction(signedTx);

    return { serializedTx };
  };
};
