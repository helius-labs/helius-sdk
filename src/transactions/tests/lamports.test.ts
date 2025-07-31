import { solToLamports, LAMPORTS_PER_SOL } from "../lamports";

describe("solToLamports Test", () => {
  it("Converts whole SOL correctly", () => {
    expect(solToLamports(1)).toBe(BigInt(LAMPORTS_PER_SOL));
  });

  it("Rounds to nearest lamport", () => {
    // 1 lamport ≈ 0.000000001 SOL
    expect(solToLamports(0.0000000014)).toBe(1n); // rounds up
    expect(solToLamports(0.0000000005)).toBe(1n); // .5 rounds up
  });

  it("Handles fractional SOL", () => {
    const v = 1.23456789;
    expect(solToLamports(v)).toBe(BigInt(Math.round(v * LAMPORTS_PER_SOL)));
  });
});
