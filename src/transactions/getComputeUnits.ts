import {
  type BaseTransactionMessage,
  type Rpc,
  type SolanaRpcApi,
  type TransactionMessageWithFeePayer,
} from "@solana/kit";
import { estimateComputeUnitLimitFactory } from "@solana-program/compute-budget";
import { GetComputeUnitsOpts } from "./types";

export type GetComputeUnitsFn = (
  message: BaseTransactionMessage & TransactionMessageWithFeePayer,
  opts?: GetComputeUnitsOpts
) => Promise<number>;

export const makeGetComputeUnits = (
  raw: Rpc<SolanaRpcApi>
): GetComputeUnitsFn => {
  const estimateFn = estimateComputeUnitLimitFactory({
    rpc: raw,
  });

  return async (
    message,
    { min = 1_000, bufferPct = 0.1 }: GetComputeUnitsOpts = {}
  ) => {
    const rawUnits = await estimateFn(message);
    const units = Number(rawUnits);

    return Math.max(min, Math.ceil(units * (1 + bufferPct)));
  };
};
