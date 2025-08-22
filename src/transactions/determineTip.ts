import { fetchTipFloor75th } from "./fetchTipFloor";
import { solToLamports } from "./lamports";

/**
 * Returns a SOL value for the tip:
 *  • current 75‑percentile landed‑tip floor, **or**
 *  • fallback 0.001 SOL (Sender minimum)
 */
export const determineTipSol = async (swqosOnly: boolean): Promise<bigint> => {
  const floorSol = await fetchTipFloor75th();
  const minSol = swqosOnly ? 0.0005 : 0.001;
  const chosenSol = Math.max(floorSol ?? minSol, minSol);

  return solToLamports(chosenSol);
};
