import type {
  Rpc,
  SolanaRpcApi,
  Base64EncodedWireTransaction,
} from "@solana/kit";
import { BroadcastOptions } from "./types.js";
import { stringifyTxError } from "./pollTransactionConfirmation.js";

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
    let expired = false;

    while (true) {
      const { value } = await raw
        .getSignatureStatuses([signature], { searchTransactionHistory: false })
        .send();
      const status = value[0];

      if (status) {
        if (status.err) {
          throw new Error(
            `Transaction failed on-chain: ${stringifyTxError(status.err)}`
          );
        }
        if (
          status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
        ) {
          return signature;
        }
      }

      // Give up only after a status read fresher than the expiry height read
      if (expired) {
        throw new Error(
          "Block height exceeded lastValidBlockHeight, and the transaction failed to land on-chain"
        );
      }

      // Expiry before the deadline: past both, the definite error wins
      const blockHeight = Number(await raw.getBlockHeight().send());
      if (blockHeight > expiry) {
        expired = true;
        continue;
      }

      // Deadline after the status read, so a tx that landed during the last
      // wait (capped at the deadline) is not reported as timed out
      const remaining = started + pollTimeoutMs - Date.now();
      if (remaining <= 0) {
        throw new Error("Transaction confirmation timed-out");
      }

      await new Promise((r) =>
        setTimeout(r, Math.min(pollIntervalMs, remaining))
      );
    }
  };
};
