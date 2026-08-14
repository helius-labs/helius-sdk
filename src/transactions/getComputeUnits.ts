import {
  type TransactionMessage,
  type Rpc,
  type SolanaRpcApi,
  type TransactionMessageWithFeePayer,
  estimateComputeUnitLimitFactory,
} from "@solana/kit";
import { GetComputeUnitsOpts } from "./types";

export type GetComputeUnitsFn = (
  message: TransactionMessage & TransactionMessageWithFeePayer,
  opts?: GetComputeUnitsOpts
) => Promise<number>;

/**
 * Estimates the compute units a transaction message will consume, then applies
 * a floor and a safety buffer.
 *
 * The estimator comes from `@solana/kit` rather than
 * `@solana-program/compute-budget`. Both raise the limit to the maximum before
 * simulating, but the compute-budget one does it by appending a
 * `SetComputeUnitLimit` instruction — a no-op on version 1 transactions
 * (SIMD-0385), which would leave v1 simulations running against the default
 * limit and failing on compute exhaustion. Kit's estimator sets the limit
 * through a version-aware helper that writes v1's header config instead.
 *
 * Kit 7 supersedes this with `estimateResourceLimitsFactory`, which also
 * returns v1's loaded-accounts-data-size limit; it does not exist in the
 * currently supported kit 6.x range.
 */
export const makeGetComputeUnits = (
  raw: Rpc<SolanaRpcApi>
): GetComputeUnitsFn => {
  // Built on first estimate rather than up front. The eager client constructs
  // this helper whether or not the consumer ever sends a transaction, and
  // deferring keeps that construction free.
  let estimateFn: ReturnType<typeof estimateComputeUnitLimitFactory>;

  return async (
    message,
    { min = 1_000, bufferPct = 0.1 }: GetComputeUnitsOpts = {}
  ) => {
    if (!estimateFn) estimateFn = estimateComputeUnitLimitFactory({ rpc: raw });

    const rawUnits = await estimateFn(message);
    const units = Number(rawUnits);

    return Math.max(min, Math.ceil(units * (1 + bufferPct)));
  };
};
