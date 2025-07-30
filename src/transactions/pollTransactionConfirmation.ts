import type { Rpc, Signature, SolanaRpcApi } from "@solana/kit";
import { PollTxOptions } from "./types";

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

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - started > timeout) {
        throw new Error(
          `Transaction ${signature} not confirmed within ${timeout} ms`
        );
      }

      if (lastValidBlockHeight !== undefined) {
        const blockHeight = Number(await raw.getBlockHeight().send());
        if (blockHeight > Number(lastValidBlockHeight)) {
          const { value } = await raw
            .getSignatureStatuses([signature], {
              searchTransactionHistory: false,
            })
            .send();

          const status = value[0];
          if (
            status?.confirmationStatus &&
            confirmationStatuses.includes(status.confirmationStatus)
          )
            return signature;

          throw new Error(
            `Block height (${blockHeight}) exceeded lastValidBlockHeight (${lastValidBlockHeight}) and tx not found in a confirmed block`
          );
        }
      }

      const { value } = await raw
        .getSignatureStatuses([signature], { searchTransactionHistory: false })
        .send();

      const status = value[0];
      if (status) {
        if (status.err) {
          throw new Error(
            `Transaction ${signature} failed on-chain: ${JSON.stringify(
              status.err
            )}`
          );
        }

        if (
          status.confirmationStatus &&
          confirmationStatuses.includes(status.confirmationStatus)
        ) {
          return signature;
        }
      }

      await new Promise((r) => setTimeout(r, interval));
    }
  };
};
