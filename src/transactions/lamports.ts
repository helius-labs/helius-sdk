export const LAMPORTS_PER_SOL = 1_000_000_000;

export const solToLamports = (sol: number): bigint => {
  return BigInt(Math.round(sol * LAMPORTS_PER_SOL));
};
