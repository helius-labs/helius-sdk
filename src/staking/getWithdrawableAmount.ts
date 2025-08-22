import { Address, Rpc, SolanaRpcApi, address } from "@solana/kit";
import { STAKE_STATE_LEN, U64_MAX } from "./types";

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

    // Guard: must be stake OR just initialised; never delegated
    if (!info.stake && info.meta?.type !== "initialized") {
      throw new Error("Not a valid stake account");
    }

    const deactivationStr =
      info.stake?.delegation?.deactivationEpoch ?? U64_MAX.toString();

    const deactivationEpoch = BigInt(deactivationStr);
    const currentEpoch = BigInt((await rpc.getEpochInfo().send()).epoch);

    // If still active (not yet cooled down), return 0
    if (deactivationEpoch > currentEpoch) return 0;
    if (includeRentExempt) return Number(lamports);

    const rentExempt = await rpc
      .getMinimumBalanceForRentExemption(BigInt(STAKE_STATE_LEN))
      .send();

    const withdrawable = lamports > rentExempt ? lamports - rentExempt : 0n;
    return Number(withdrawable);
  };
};
