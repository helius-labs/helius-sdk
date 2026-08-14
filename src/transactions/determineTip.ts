import { fetchTipFloor75th } from "./fetchTipFloor";
import { solToLamports } from "./lamports";
import { MIN_TIP_LAMPORTS_MAX, MIN_TIP_LAMPORTS_SWQOS } from "./types";

/**
 * Returns a lamport tip value:
 *  • current 75-percentile landed-tip floor, **or**
 *  • the Sender minimum for the chosen tier (whichever is higher).
 *
 * Tier minimums: Sender Max (`swqosOnly: false`) = 0.001 SOL; SWQOS-only
 * (`swqosOnly: true`) = 0.000005 SOL.
 */
export const determineTipSol = async (swqosOnly: boolean): Promise<bigint> => {
  const floorSol = await fetchTipFloor75th();
  const minLamports = swqosOnly ? MIN_TIP_LAMPORTS_SWQOS : MIN_TIP_LAMPORTS_MAX;

  const floorLamports =
    floorSol != null ? solToLamports(floorSol) : minLamports;

  return floorLamports > minLamports ? floorLamports : minLamports;
};
