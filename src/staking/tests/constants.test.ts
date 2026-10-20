import { LAMPORTS_PER_SOL_BIGINT, U64_MAX } from "../types";

describe("Staking constants", () => {
  it("U64_MAX is the max u64 as a bigint", () => {
    expect(typeof U64_MAX).toBe("bigint");
    expect(U64_MAX).toBe(2n ** 64n - 1n);
  });

  it("LAMPORTS_PER_SOL_BIGINT is 1e9 as a bigint", () => {
    expect(typeof LAMPORTS_PER_SOL_BIGINT).toBe("bigint");
    expect(LAMPORTS_PER_SOL_BIGINT * 2n).toBe(2_000_000_000n);
  });
});
