const TIMEOUT_MS = 2_000;
const TTL_MS = 15_000;
const FAIL_TTL_MS = 3_000;

let cached: { value: number | undefined; expires: number } | undefined;

const get = async (signal: AbortSignal): Promise<number | undefined> => {
  try {
    const res = await fetch(
      "https://bundles.jito.wtf/api/v1/bundles/tip_floor",
      { cache: "no-store", signal }
    );

    const json = await res.json();
    const val = json?.[0]?.landed_tips_75th_percentile;

    return typeof val === "number" ? val : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Jito's 75th-percentile landed tip (in SOL), or `undefined` on failure or
 * after 2s. Cached 15s (3s after a failure).
 */
export const fetchTipFloor75th = async (): Promise<number | undefined> => {
  if (cached && Date.now() < cached.expires) return cached.value;

  // Own timer, so a fetch that ignores `signal` can't hang the send
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const value = await Promise.race([
    get(ctrl.signal),
    new Promise<undefined>((resolve) => {
      timer = setTimeout(() => {
        ctrl.abort();
        resolve(undefined);
      }, TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timer);

  // A late failure doesn't replace a fresher floor
  if (value === undefined && cached && Date.now() < cached.expires)
    return cached.value;

  cached = {
    value,
    expires: Date.now() + (value === undefined ? FAIL_TTL_MS : TTL_MS),
  };
  return value;
};
