import type { Rpc, Signature, SolanaRpcApi } from "@solana/kit";
import { PollTxOptions } from "./types";

// @solana/kit upcasts integers in getSignatureStatuses responses to bigint
// (no numeric-keypath exemption), which JSON.stringify cannot serialize
const stringifyTxError = (err: unknown): string =>
  JSON.stringify(err, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value
  );

export const makePollTransactionConfirmation = (raw: Rpc<SolanaRpcApi>) => {
  return async function poll(
    signature: Signature,
    {
      confirmationStatuses = ["confirmed", "finalized"],
      timeout = 60_000,
      interval = 2_000,
      lastValidBlockHeight,
    }: PollTxOptions = {}
  ): Promise<Signature> {
    if (lastValidBlockHeight !== undefined) {
      const chainHeight = Number(await raw.getBlockHeight().send());

      if (Number(lastValidBlockHeight) - chainHeight > 150) {
        throw new Error(
          `Provided lastValidBlockHeight (${lastValidBlockHeight}) is more than 150 blocks ahead of current height (${chainHeight})`
        );
      }
    }

    const started = Date.now();
    let expiredAtHeight: number | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - started > timeout) {
        throw new Error(
          `Transaction ${signature} not confirmed within ${timeout} ms`
        );
      }

      const { value } = await raw
        .getSignatureStatuses([signature], { searchTransactionHistory: false })
        .send();

      const status = value[0];
      if (status?.err) {
        throw new Error(
          `Transaction ${signature} failed on-chain: ${stringifyTxError(
            status.err
          )}`
        );
      }

      if (
        status?.confirmationStatus &&
        confirmationStatuses.includes(status.confirmationStatus)
      ) {
        return signature;
      }

      // Expiry is terminal only after a status fetched *after* the expiry was
      // observed came back inconclusive: a tx can still confirm (or fail) in a
      // block at or before lastValidBlockHeight while the chain tip moves past
      // it, so the final status read must be fresher than the height read
      if (expiredAtHeight !== undefined) {
        throw new Error(
          `Block height (${expiredAtHeight}) exceeded lastValidBlockHeight (${lastValidBlockHeight}) and tx not found in a confirmed block`
        );
      }

      if (lastValidBlockHeight !== undefined) {
        const blockHeight = Number(await raw.getBlockHeight().send());
        if (blockHeight > Number(lastValidBlockHeight)) {
          expiredAtHeight = blockHeight;
          continue;
        }
      }

      await new Promise((r) => setTimeout(r, interval));
    }
  };
};
