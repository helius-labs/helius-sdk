import { Address, Rpc, SolanaRpcApi, address } from "@solana/kit";
import { STAKE_STATE_LEN } from "./types";

export const makeGetWithdrawableAmount = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (
    stakeAccount: Address | string,
    includeRentExempt = false
  ): Promise<number> => {
    const stakeAddr =
      typeof stakeAccount === "string" ? address(stakeAccount) : stakeAccount;

    const { value: accInfo } = await rpc
      .getAccountInfo(stakeAddr, { encoding: "jsonParsed" })
      .send();

    if (!accInfo) throw new Error("Stake account not found");

    const { lamports, data } = accInfo;
    const parsed: any = (data as any)?.parsed; // We know it's JSON parsed

    if (!parsed?.info?.meta) {
      throw new Error("Not a valid stake account");
    }

    const info = parsed.info;

    // Allow an active/deactivating stake account or an initialized
    // (undelegated) one. The stake state discriminator is on parsed.type,
    // not on meta, so meta itself never carries a "type" field.
    if (!info.stake && parsed.type !== "initialized") {
      throw new Error("Not a valid stake account");
    }

    // An initialized (undelegated) account has no delegation and is never
    // active, so it's always treated as already cooled down.
    if (info.stake) {
      const deactivationEpoch = BigInt(info.stake.delegation.deactivationEpoch);
      const currentEpoch = BigInt((await rpc.getEpochInfo().send()).epoch);

      // Per the stake program's own state machine
      // (Delegation::stake_activating_and_deactivating), the delegation is
      // still "deactivating" (non-zero effective stake) through the epoch
      // equal to deactivationEpoch — only fully inactive once currentEpoch
      // strictly exceeds it.
      if (deactivationEpoch >= currentEpoch) return 0;
    }

    if (includeRentExempt) return Number(lamports);

    const rentExempt = await rpc
      .getMinimumBalanceForRentExemption(BigInt(STAKE_STATE_LEN))
      .send();

    const withdrawable = lamports > rentExempt ? lamports - rentExempt : 0n;
    return Number(withdrawable);
  };
};
