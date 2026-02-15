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
} from "@solana/kit";
import {
  getTransferInstruction,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { TREASURY, USDC_MINT, PAYMENT_AMOUNT, RPC_URL, WS_URL } from "./constants";

export async function payUSDC(secretKey: Uint8Array): Promise<string> {
  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const signer = await createKeyPairSignerFromBytes(secretKey);
  const signerAddress = signer.address;

  const [senderAta] = await findAssociatedTokenPda({
    owner: signerAddress,
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const [receiverAta] = await findAssociatedTokenPda({
    owner: toAddress(TREASURY),
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferIx = getTransferInstruction({
    source: senderAta,
    destination: receiverAta,
    authority: signer,
    amount: PAYMENT_AMOUNT,
  });

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([transferIx], tx),
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
    { commitment: "confirmed" },
  );

  return getSignatureFromTransaction(signedTransaction);
}
