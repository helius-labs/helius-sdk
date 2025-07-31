import type {
  Rpc,
  SolanaRpcApi,
  Base64EncodedWireTransaction,
} from "@solana/kit";
import { BroadcastOptions } from "./types";

export const broadcastTransactionFactory = (raw: Rpc<SolanaRpcApi>) => {
  return async function broadcastBase64(
    wireTx64: string,
    {
      lastValidBlockHeightOffset = 150,
      pollTimeoutMs = 60_000,
      pollIntervalMs = 2_000,
      skipPreflight = true,
      commitment = "confirmed",
      maxRetries = 0n,
    }: BroadcastOptions = {}
  ): Promise<string> {
    if (lastValidBlockHeightOffset < 0) {
      throw new Error("lastValidBlockHeightOffset must be a positive number");
    }

    const signature = await raw
      .sendTransaction(wireTx64 as Base64EncodedWireTransaction, {
        encoding: "base64",
        skipPreflight,
        preflightCommitment: commitment,
        maxRetries,
      })
      .send();

    const bhInfo = await raw.getLatestBlockhash({ commitment }).send();
    let lastValidBlockHeight = bhInfo.value.lastValidBlockHeight;

    const chainHeight = Number(await raw.getBlockHeight().send());
    const expiry = Math.min(
      Number(lastValidBlockHeight),
      chainHeight + lastValidBlockHeightOffset
    );

    // Poll signature status
    const started = Date.now();

    while (true) {
      if (Date.now() - started > pollTimeoutMs) {
        throw new Error("Transaction confirmation timed-out");
      }

      const { value } = await raw
        .getSignatureStatuses([signature], { searchTransactionHistory: false })
        .send();
      const status = value[0];

      if (status) {
        if (status.err) {
          throw new Error(
            `Transaction failed on-chain: ${JSON.stringify(status.err)}`
          );
        }
        if (
          status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
        ) {
          return signature;
        }
      }

      const blockHeight = Number(await raw.getBlockHeight().send());
      if (blockHeight > expiry) {
        throw new Error(
          "Block height exceeded lastValidBlockHeight, and the transaction failed to land on-chain"
        );
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  };
};
