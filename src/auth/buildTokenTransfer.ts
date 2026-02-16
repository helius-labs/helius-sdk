import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  createKeyPairSignerFromBytes,
  address as toAddress,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  type Instruction,
  type Address,
} from "@solana/kit";
import {
  getTransferInstruction,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { RPC_URL, WS_URL } from "./constants";

export interface TokenTransferParams {
  secretKey: Uint8Array;
  recipientAddress: string;
  mintAddress: Address;
  amount: bigint;
  additionalInstructions?: Instruction[];
}

export async function buildAndSendTokenTransfer(
  params: TokenTransferParams
): Promise<string> {
  const {
    secretKey,
    recipientAddress,
    mintAddress,
    amount,
    additionalInstructions = [],
  } = params;

  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const signer = await createKeyPairSignerFromBytes(secretKey);

  const [senderAta] = await findAssociatedTokenPda({
    owner: signer.address,
    mint: mintAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const [receiverAta] = await findAssociatedTokenPda({
    owner: toAddress(recipientAddress),
    mint: mintAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferIx = getTransferInstruction({
    source: senderAta,
    destination: receiverAta,
    authority: signer,
    amount,
  });

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [transferIx, ...additionalInstructions],
        tx
      )
  );

  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);

  const transactionWithBlockHeight = {
    ...signedTransaction,
    lifetimeConstraint: {
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
  };

  await sendAndConfirm(
    transactionWithBlockHeight as Parameters<typeof sendAndConfirm>[0],
    { commitment: "confirmed" }
  );

  return getSignatureFromTransaction(signedTransaction);
}
