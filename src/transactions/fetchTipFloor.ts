/**
 * Hit Jito’s public endpoint and return the 75‑percentile landed‑tip
 * (in SOL) or `undefined` if the call fails / payload is malformed
 */
export const fetchTipFloor75th = async (): Promise<number | undefined> => {
  try {
    const res = await fetch(
      "https://bundles.jito.wtf/api/v1/bundles/tip_floor",
      { cache: "no-store" },
    );

    const json = await res.json();
    const val = json?.[0]?.landed_tips_75th_percentile;

    return typeof val === "number" ? val : undefined;
  } catch {
    return undefined;
  }
}
