const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000n;

/** A resolved priority fee, expressed in both units the network uses. */
export type ResolvedPriorityFee = Readonly<{
  /** MicroLamports per compute unit — what legacy and v0 transactions request. */
  rate: number;
  /** Total lamports — what version 1 transactions carry in their header config. */
  lamports: bigint;
}>;

export type ResolvePriorityFeeInput = Readonly<{
  /** Helius' recommended rate, in microLamports per CU. */
  estimate: number;
  /** Compute-unit limit the transaction will request. */
  units: number;
  /** Optional ceiling on the per-CU rate. */
  rateCap?: number;
  /** Optional ceiling on total lamports spent on priority. */
  lamportsCap?: number | bigint;
}>;

/**
 * Normalises a caller-supplied lamport cap into a non-negative whole number of
 * lamports, or `null` for "no ceiling".
 *
 * `BigInt()` throws on a fraction, and a cap is easy to compute into one
 * (`budget / 3`), so the value is floored first.
 *
 * Non-finite input resolves the way the same input resolves for `rateCap`,
 * where `Math.min` decides it: `Infinity` is no ceiling at all, while `NaN`
 * — which can only be a caller bug — collapses to zero rather than silently
 * lifting the ceiling the caller asked for.
 */
const toWholeLamports = (cap: number | bigint): bigint | null => {
  if (typeof cap === "bigint") return cap < 0n ? 0n : cap;
  if (cap === Infinity) return null;
  if (Number.isNaN(cap)) return 0n;

  return BigInt(Math.max(0, Math.floor(cap)));
};

/**
 * Converts an integer microLamports-per-CU rate into a total lamport fee,
 * rounding up so the transaction never underpays relative to that rate.
 */
const toLamports = (rate: number, units: number): bigint => {
  const totalMicroLamports =
    BigInt(rate) * BigInt(Math.max(0, Math.floor(units)));

  return (
    (totalMicroLamports + MICRO_LAMPORTS_PER_LAMPORT - 1n) /
    MICRO_LAMPORTS_PER_LAMPORT
  );
};

/**
 * Resolves the priority fee a transaction should pay, in both the per-CU rate
 * that legacy/v0 transactions request and the total lamport amount that version
 * 1 transactions carry in their header config (SIMD-0385).
 *
 * Both caps are applied by clamping the rate, so the returned `rate` and
 * `lamports` always describe the same fee regardless of transaction version.
 *
 * The rate is floored to a whole microLamport. Helius can return a fractional
 * estimate, and the compute-budget instruction encodes the rate as a `u64` —
 * passing a fraction there throws. Rounding down rather than to nearest also
 * keeps `rateCap` and `lamportsCap` true ceilings.
 */
export const resolvePriorityFee = ({
  estimate,
  units,
  rateCap,
  lamportsCap,
}: ResolvePriorityFeeInput): ResolvedPriorityFee => {
  let rate = rateCap != null ? Math.min(estimate, rateCap) : estimate;

  if (lamportsCap != null && units > 0) {
    const cap = toWholeLamports(lamportsCap);

    if (cap !== null) {
      rate = Math.min(
        rate,
        Number((cap * MICRO_LAMPORTS_PER_LAMPORT) / BigInt(Math.floor(units)))
      );
    }
  }

  rate = Number.isFinite(rate) ? Math.max(0, Math.floor(rate)) : 0;

  return { rate, lamports: toLamports(rate, units) };
};
