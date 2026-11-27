import {
  appendTransactionMessageInstruction,
  assertIsTransactionWithBlockhashLifetime,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey, network: "devnet" });

  try {
    // Kit helpers that confirm over WebSocket take both clients. The
    // subscriptions client already points at Helius with your API key.
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc: helius.kitRpc,
      rpcSubscriptions: await helius.getKitRpcSubscriptions(),
    });

    const payer = await generateKeyPairSigner();
    const recipient = await generateKeyPairSigner();
    await helius.airdrop(payer.address, 1_000_000_000n);

    const { value: latestBlockhash } = await helius.kitRpc
      .getLatestBlockhash()
      .send();

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(payer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) =>
        appendTransactionMessageInstruction(
          getTransferSolInstruction({
            source: payer,
            destination: recipient.address,
            amount: 1_000_000n,
          }),
          m
        )
    );

    const signed = await signTransactionMessageWithSigners(message);
    assertIsTransactionWithBlockhashLifetime(signed);
    await sendAndConfirm(signed, { commitment: "confirmed" });
    console.log("Confirmed: ", getSignatureFromTransaction(signed));
  } catch (error) {
    console.error("Error sending transaction: ", error);
  }
})();
