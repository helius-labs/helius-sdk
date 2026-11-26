import type * as TipFloorModule from "../fetchTipFloor.js";

const g = global as any;

const okResponse = (tip: unknown) => ({
  json: () => Promise.resolve([{ landed_tips_75th_percentile: tip }]),
});

describe("fetchTipFloor75th Tests", () => {
  let fetchTipFloor75th: typeof TipFloorModule.fetchTipFloor75th;

  beforeEach(() => {
    // Fresh module per test, so the module-level cache starts empty
    jest.isolateModules(() => {
      ({ fetchTipFloor75th } = require("../fetchTipFloor.js"));
    });
    jest.useFakeTimers({ now: 1_000_000 });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("Returns the 75-percentile tip when payload is valid", async () => {
    g.fetch = jest.fn().mockResolvedValue(okResponse(0.0013));

    expect(await fetchTipFloor75th()).toBe(0.0013);
  });

  it("Returns undefined on malformed payload", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ unexpected: true }),
    });

    expect(await fetchTipFloor75th()).toBeUndefined();
  });

  it("Returns undefined on network error", async () => {
    g.fetch = jest.fn().mockRejectedValue(new Error("boom"));
    expect(await fetchTipFloor75th()).toBeUndefined();
  });

  it("Aborts the request and returns undefined after 2s", async () => {
    // A fetch that never settles unless its signal aborts
    g.fetch = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal!.reason)
          );
        })
    );

    let settled = false;
    const pending = fetchTipFloor75th().finally(() => (settled = true));

    await jest.advanceTimersByTimeAsync(1_999);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    expect(await pending).toBeUndefined();
    expect(g.fetch.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("Returns undefined after 2s even if fetch ignores the signal", async () => {
    g.fetch = jest.fn(() => new Promise(() => {}));

    const pending = fetchTipFloor75th();
    await jest.advanceTimersByTimeAsync(2_000);

    expect(await pending).toBeUndefined();
  });

  it("Clears its timer once the request settles", async () => {
    g.fetch = jest.fn().mockResolvedValue(okResponse(0.0013));

    await fetchTipFloor75th();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("Serves a cached floor for 15s, then refetches", async () => {
    g.fetch = jest
      .fn()
      .mockResolvedValueOnce(okResponse(0.0013))
      .mockResolvedValueOnce(okResponse(0.002));

    expect(await fetchTipFloor75th()).toBe(0.0013);
    jest.advanceTimersByTime(14_999);
    expect(await fetchTipFloor75th()).toBe(0.0013);
    expect(g.fetch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    expect(await fetchTipFloor75th()).toBe(0.002);
    expect(g.fetch).toHaveBeenCalledTimes(2);
  });

  it("Caches a failure for only 3s", async () => {
    g.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(okResponse(0.0013));

    expect(await fetchTipFloor75th()).toBeUndefined();
    jest.advanceTimersByTime(2_999);
    expect(await fetchTipFloor75th()).toBeUndefined();
    expect(g.fetch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    expect(await fetchTipFloor75th()).toBe(0.0013);
    expect(g.fetch).toHaveBeenCalledTimes(2);
  });

  it("Keeps a fresher floor when an older request fails late", async () => {
    g.fetch = jest
      .fn()
      .mockReturnValueOnce(new Promise(() => {})) // A: stalls until timeout
      .mockResolvedValueOnce(okResponse(0.002)); // B: succeeds

    const a = fetchTipFloor75th();
    await jest.advanceTimersByTimeAsync(1_000);
    expect(await fetchTipFloor75th()).toBe(0.002);

    await jest.advanceTimersByTimeAsync(1_000); // A times out
    expect(await a).toBe(0.002);

    jest.advanceTimersByTime(12_999); // within B's 15s TTL
    expect(await fetchTipFloor75th()).toBe(0.002);
    expect(g.fetch).toHaveBeenCalledTimes(2);
  });

  it("Starts the TTL when the request settles, not when it starts", async () => {
    let resolveFetch!: (v: unknown) => void;
    g.fetch = jest
      .fn()
      .mockReturnValueOnce(new Promise((r) => (resolveFetch = r)))
      .mockResolvedValueOnce(okResponse(0.002));

    const first = fetchTipFloor75th();
    await jest.advanceTimersByTimeAsync(1_000);
    resolveFetch(okResponse(0.0013));
    expect(await first).toBe(0.0013);

    jest.advanceTimersByTime(14_999);
    expect(await fetchTipFloor75th()).toBe(0.0013);
    expect(g.fetch).toHaveBeenCalledTimes(1);
  });
});
