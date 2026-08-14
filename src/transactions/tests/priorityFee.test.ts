import { resolvePriorityFee } from "../priorityFee";

describe("resolvePriorityFee Tests", () => {
  it("Converts a per-CU rate into the equivalent total lamports", () => {
    // 10_000 microLamports/CU * 42_000 CU = 420_000_000 microLamports
    expect(resolvePriorityFee({ estimate: 10_000, units: 42_000 })).toEqual({
      rate: 10_000,
      lamports: 420n,
    });
  });

  it("Rounds the total up so the transaction never underpays", () => {
    // 1 * 1_500 = 1_500 microLamports = 0.0015 lamports
    expect(resolvePriorityFee({ estimate: 1, units: 1_500 })).toEqual({
      rate: 1,
      lamports: 1n,
    });
  });

  it("Clamps the rate to rateCap", () => {
    expect(
      resolvePriorityFee({ estimate: 10_000, units: 42_000, rateCap: 7_000 })
    ).toEqual({ rate: 7_000, lamports: 294n });
  });

  it("Leaves the estimate alone when rateCap is above it", () => {
    expect(
      resolvePriorityFee({ estimate: 500, units: 1_000, rateCap: 10_000 })
    ).toEqual({ rate: 500, lamports: 1n });
  });

  it("Clamps total spend to lamportsCap by lowering the rate", () => {
    const { rate, lamports } = resolvePriorityFee({
      estimate: 10_000,
      units: 42_000,
      lamportsCap: 100,
    });

    expect(lamports).toBeLessThanOrEqual(100n);
    expect(rate).toBeLessThan(10_000);
  });

  it("Applies rateCap before lamportsCap", () => {
    // 7_000 * 42_000 / 1e6 = 294 lamports, already under the lamport cap
    expect(
      resolvePriorityFee({
        estimate: 10_000,
        units: 42_000,
        rateCap: 7_000,
        lamportsCap: 1_000,
      })
    ).toEqual({ rate: 7_000, lamports: 294n });
  });

  it("Floors a fractional lamportsCap instead of throwing", () => {
    // A cap is easy to compute into a fraction: 100_000 / 3
    const { lamports } = resolvePriorityFee({
      estimate: 10_000,
      units: 42_000,
      lamportsCap: 100_000 / 3,
    });

    expect(lamports).toBeLessThanOrEqual(33_333n);
  });

  it("Resolves a non-finite lamportsCap the way rateCap resolves the same input", () => {
    const args = { estimate: 10_000, units: 42_000 };

    for (const cap of [NaN, Infinity, -Infinity]) {
      expect(() =>
        resolvePriorityFee({ ...args, lamportsCap: cap })
      ).not.toThrow();

      // Math.min(rate, Infinity) leaves the rate alone, so Infinity is no cap
      expect(resolvePriorityFee({ ...args, lamportsCap: cap })).toEqual(
        resolvePriorityFee({ ...args, rateCap: cap })
      );
    }

    expect(resolvePriorityFee({ ...args, lamportsCap: Infinity })).toEqual({
      rate: 10_000,
      lamports: 420n,
    });
    expect(resolvePriorityFee({ ...args, lamportsCap: NaN })).toEqual({
      rate: 0,
      lamports: 0n,
    });
  });

  it("Treats a negative bigint lamportsCap as zero", () => {
    expect(
      resolvePriorityFee({ estimate: 10_000, units: 42_000, lamportsCap: -5n })
    ).toEqual({ rate: 0, lamports: 0n });
  });

  it("Accepts a bigint lamportsCap", () => {
    const { lamports } = resolvePriorityFee({
      estimate: 10_000,
      units: 42_000,
      lamportsCap: 50n,
    });

    expect(lamports).toBeLessThanOrEqual(50n);
  });

  it("Treats a negative lamportsCap as zero", () => {
    expect(
      resolvePriorityFee({ estimate: 10_000, units: 42_000, lamportsCap: -5 })
    ).toEqual({ rate: 0, lamports: 0n });
  });

  it("Skips the lamport cap when there are no units to spread it across", () => {
    // Guards the BigInt division; the rate cap still applies
    expect(
      resolvePriorityFee({
        estimate: 10_000,
        units: 0,
        rateCap: 8_000,
        lamportsCap: 100,
      })
    ).toEqual({ rate: 8_000, lamports: 0n });
  });

  it("Floors a fractional estimate, which the u64 encoder would reject", () => {
    const { rate, lamports } = resolvePriorityFee({
      estimate: 4032.3712,
      units: 42_000,
    });

    expect(Number.isInteger(rate)).toBe(true);
    expect(rate).toBe(4032);
    // ceil(4032 * 42_000 / 1e6) = ceil(169.344) = 170
    expect(lamports).toBe(170n);
  });

  it("Never rounds a capped rate back above its cap", () => {
    // Rounding to nearest would give 7001 and breach the cap
    expect(
      resolvePriorityFee({ estimate: 10_000, units: 42_000, rateCap: 7000.6 })
        .rate
    ).toBe(7000);
  });

  it("Floors a sub-1 estimate to zero rather than throwing", () => {
    expect(resolvePriorityFee({ estimate: 0.4, units: 42_000 })).toEqual({
      rate: 0,
      lamports: 0n,
    });
  });

  it("Coerces a non-finite estimate to zero", () => {
    expect(resolvePriorityFee({ estimate: NaN, units: 1_000 }).rate).toBe(0);
    expect(resolvePriorityFee({ estimate: Infinity, units: 1_000 }).rate).toBe(
      0
    );
  });

  it("Tolerates a fractional compute-unit limit", () => {
    expect(() =>
      resolvePriorityFee({ estimate: 10_000, units: 1_500.7, lamportsCap: 50 })
    ).not.toThrow();
  });

  it("Handles rates large enough to overflow Number arithmetic", () => {
    // 1e9 microLamports/CU * 1.4M CU exceeds Number.MAX_SAFE_INTEGER
    const { lamports } = resolvePriorityFee({
      estimate: 1_000_000_000,
      units: 1_400_000,
    });

    expect(lamports).toBe(1_400_000_000n);
  });
});
