import { createHelius } from "helius-sdk";
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  getSignatureFromTransaction,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import bs58 from "bs58";

/**
 * Submit an ordered bundle (max 5 transactions) over Sender Max.
 *
 * Sender Max handles single transactions and bundles over the same paths and
 * priority auction. Include the 0.001 SOL Sender tip in at least one of the
 * bundled transactions; landing is tracked per-signature, not by bundle ID.
 *
 * A bundle is an early signal of routing, not a landing guarantee.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const feePayerSigner = await createKeyPairSignerFromBytes(
      bs58.decode(process.env.FEEPAYER_SECRET ?? "")
    );

    const toPubkey = address("your_to_address");
    const { value: blockhash } = await helius.getLatestBlockhash();

    // Build + sign two transfers as an ordered bundle. The first transaction
    // carries the 0.001 SOL Sender Max minimum tip (omitted here for brevity —
    // add your tip instruction to at least one transaction).
    const buildSigned = async (amount: bigint) => {
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(feePayerSigner, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
        (m) =>
          appendTransactionMessageInstruction(
            getTransferSolInstruction({
              amount: lamports(amount),
              destination: toPubkey,
              source: feePayerSigner,
            }),
            m
          )
      );
      return signTransactionMessageWithSigners(message);
    };

    const bundle = [
      await buildSigned(1_000_000n), // 0.001 SOL
      await buildSigned(500_000n), // 0.0005 SOL
    ];

    const signatures = await helius.tx.sendBundleWithSender(bundle, {
      region: "US_EAST",
      pollTimeoutMs: 60_000,
      pollIntervalMs: 2_000,
    });

    console.log("Bundle signatures:", signatures);
    for (const sig of bundle.map(getSignatureFromTransaction)) {
      console.log(`Explorer: https://orb.helius.dev/tx/${sig}?cluster=mainnet`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
