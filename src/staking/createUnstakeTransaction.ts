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

import { getDeactivateInstruction } from "@solana-program/stake";

import { SYSVAR_CLOCK } from "./types";

export const makeCreateUnstakeTransaction = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (
    ownerSigner: KeyPairSigner<string>,
    stakeAccount: Address
  ): Promise<{ serializedTx: string }> => {
    const deactivateIx = getDeactivateInstruction({
      stake: stakeAccount,
      clockSysvar: SYSVAR_CLOCK,
      stakeAuthority: ownerSigner,
    });

    const { value: blockHeight } = await rpc.getLatestBlockhash().send();

    const msg = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayer(ownerSigner.address, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(blockHeight, m),
      (m) => appendTransactionMessageInstructions([deactivateIx], m)
    );

    const signedTx = await signTransactionMessageWithSigners(msg);
    const serializedTx = getBase64EncodedWireTransaction(signedTx);

    return { serializedTx };
  };
};
