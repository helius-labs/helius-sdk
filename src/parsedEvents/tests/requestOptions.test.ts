import { createHelius } from "../../rpc/index.js";
import { createHeliusEager } from "../../rpc/createHelius.eager.js";
import { makeParsedEventsClient } from "../client.js";
import type { ParsedEventsClient } from "../client.js";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const ok = () => ({ ok: true, json: async () => [] });

/** A fetch that only settles when its signal aborts, like a stalled request. */
const stalledFetch = () =>
  mockFetch.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        const { signal } = init;
        if (signal?.aborted) reject(signal.reason);
        signal?.addEventListener("abort", () => reject(signal.reason));
      })
  );

/** Call every method once with the same per-call options. */
const callAll = (
  parsedEvents: ParsedEventsClient,
  options?: { signal?: AbortSignal }
) => [
  parsedEvents.parseTransactions({ transactions: [] }, options),
  parsedEvents.getTransactionHistory({ address: "x" }, options),
  parsedEvents.scan(
    { address: "x", match: { mints: [{ mint: "m" }] } },
    options
  ),
];

const clients = (opts: Parameters<typeof createHelius>[0]) => [
  createHelius({ apiKey: "k", ...opts }).parsedEvents,
  createHeliusEager({ apiKey: "k", ...opts }).parsedEvents,
  makeParsedEventsClient("k", opts),
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe("parsedEventsUrl", () => {
  it.each([
    ["the default host", {}, "https://mainnet.helius-rpc.com/v1/parsed-events"],
    [
      "an empty url, as unset",
      { parsedEventsUrl: "" },
      "https://mainnet.helius-rpc.com/v1/parsed-events",
    ],
    [
      "a custom host",
      { parsedEventsUrl: "https://proxy.example.com/v1/parsed-events" },
      "https://proxy.example.com/v1/parsed-events",
    ],
    [
      "a custom host with trailing slashes",
      { parsedEventsUrl: "https://proxy.example.com/pe//" },
      "https://proxy.example.com/pe",
    ],
  ])("sends every method to %s", async (_, opts, base) => {
    mockFetch.mockResolvedValue(ok());
    for (const parsedEvents of clients(opts))
      await Promise.all(callAll(parsedEvents));

    const urls = mockFetch.mock.calls.map(([url]) => url);
    expect(new Set(urls)).toEqual(
      new Set([
        `${base}/transactions?api-key=k`,
        `${base}/transaction-history?api-key=k`,
        `${base}/scan?api-key=k`,
      ])
    );
    expect(urls).toHaveLength(9);
  });

  it("keeps a proxy URL's own query string", async () => {
    mockFetch.mockResolvedValue(ok());
    await createHeliusEager({
      apiKey: "k",
      parsedEventsUrl: "https://proxy.example.com/pe/?token=abc#frag",
    }).parsedEvents.parseTransactions({ transactions: [] });
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://proxy.example.com/pe/transactions?token=abc&api-key=k#frag"
    );
  });

  it("rejects an invalid URL without sending", async () => {
    const parsedEvents = createHeliusEager({
      apiKey: "k",
      parsedEventsUrl: "not a url",
    }).parsedEvents;
    await expect(
      parsedEvents.parseTransactions({ transactions: [] })
    ).rejects.toThrow("Invalid URL");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("still rejects on devnet", async () => {
    const opts = {
      network: "devnet" as const,
      parsedEventsUrl: "https://proxy.example.com/v1/parsed-events",
    };
    for (const parsedEvents of clients(opts)) {
      for (const call of callAll(parsedEvents)) {
        await expect(call).rejects.toThrow(
          "Parsed Events is only available on mainnet."
        );
      }
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("signal", () => {
  it("aborts every method on every client with the signal's reason", async () => {
    stalledFetch();
    for (const parsedEvents of clients({})) {
      const controller = new AbortController();
      const calls = callAll(parsedEvents, { signal: controller.signal });
      await new Promise((r) => setTimeout(r, 0)); // Let the lazy loads settle
      const reason = new Error("user cancelled");
      controller.abort(reason);
      for (const call of calls) await expect(call).rejects.toBe(reason);
    }
    expect(mockFetch).toHaveBeenCalledTimes(9);
  });

  it("rejects at once with a signal that already aborted", async () => {
    stalledFetch();
    const reason = new Error("already gone");
    const calls = callAll(createHeliusEager({ apiKey: "k" }).parsedEvents, {
      signal: AbortSignal.abort(reason),
    });
    for (const call of calls) await expect(call).rejects.toBe(reason);
  });

  it("stops listening to the signal once the request settles", async () => {
    mockFetch.mockResolvedValue(ok());
    const controller = new AbortController();
    const add = jest.spyOn(controller.signal, "addEventListener");
    const remove = jest.spyOn(controller.signal, "removeEventListener");

    await createHeliusEager({ apiKey: "k" }).parsedEvents.parseTransactions(
      { transactions: [] },
      { signal: controller.signal }
    );
    expect(add).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("abort", add.mock.calls[0][1]);

    // A later abort reaches nothing
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    controller.abort();
    expect(init.signal?.aborted).toBe(false);
  });

  it("ignores client options passed per call", async () => {
    stalledFetch();
    jest.useFakeTimers();
    const parsedEvents = createHeliusEager({
      apiKey: "k",
      parsedEventsTimeoutMs: 100,
    }).parsedEvents;
    // e.g. a JS caller reusing an options object
    const call = parsedEvents.parseTransactions({ transactions: [] }, {
      parsedEventsUrl: "https://elsewhere.example.com",
      parsedEventsTimeoutMs: undefined,
    } as { signal?: AbortSignal });
    const assertion = expect(call).rejects.toMatchObject({
      name: "TimeoutError",
    });
    await jest.advanceTimersByTimeAsync(100);
    await assertion;
    expect(mockFetch.mock.calls[0][0]).toMatch(
      /^https:\/\/mainnet\.helius-rpc\.com\//
    );
    jest.useRealTimers();
  });

  it("does not send the signal in the body", async () => {
    mockFetch.mockResolvedValue(ok());
    await createHeliusEager({ apiKey: "k" }).parsedEvents.scan(
      { address: "x", match: { mints: [{ mint: "m" }] } },
      { signal: new AbortController().signal }
    );
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      address: "x",
      match: { mints: [{ mint: "m" }] },
    });
  });
});

describe("parsedEventsTimeoutMs", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("rejects a stalled request with a TimeoutError", async () => {
    stalledFetch();
    const parsedEvents = createHeliusEager({
      apiKey: "k",
      parsedEventsTimeoutMs: 5_000,
    }).parsedEvents;
    const call = parsedEvents.getTransactionHistory({ address: "x" });
    const assertion = expect(call).rejects.toMatchObject({
      name: "TimeoutError",
      message: "Parsed Events request timed out after 5000ms",
    });

    await jest.advanceTimersByTimeAsync(4_999);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it("applies through the lazy clients too", async () => {
    stalledFetch();
    for (const parsedEvents of [
      createHelius({ apiKey: "k", parsedEventsTimeoutMs: 100 }).parsedEvents,
      makeParsedEventsClient("k", { parsedEventsTimeoutMs: 100 }),
    ]) {
      const call = parsedEvents.parseTransactions({ transactions: [] });
      const assertion = expect(call).rejects.toMatchObject({
        name: "TimeoutError",
      });
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
    }
  });

  it("lets the caller's signal abort first, with its own reason", async () => {
    stalledFetch();
    const controller = new AbortController();
    const call = createHeliusEager({
      apiKey: "k",
      parsedEventsTimeoutMs: 5_000,
    }).parsedEvents.parseTransactions(
      { transactions: [] },
      { signal: controller.signal }
    );
    const reason = new Error("user cancelled");
    controller.abort(reason);
    await expect(call).rejects.toBe(reason);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("clears the timer once the request settles", async () => {
    mockFetch.mockResolvedValue(ok());
    const parsedEvents = createHeliusEager({
      apiKey: "k",
      parsedEventsTimeoutMs: 5_000,
    }).parsedEvents;
    await parsedEvents.parseTransactions({ transactions: [] });
    expect(jest.getTimerCount()).toBe(0);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: "rate limited" }),
    });
    await expect(
      parsedEvents.parseTransactions({ transactions: [] })
    ).rejects.toThrow("Helius HTTP 429: rate limited");
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([Infinity, 30 * 86_400_000])(
    "doesn't time out early when it is %s",
    async (ms) => {
      stalledFetch();
      const call = createHeliusEager({
        apiKey: "k",
        parsedEventsTimeoutMs: ms,
      }).parsedEvents.parseTransactions({ transactions: [] });
      let settled = false;
      call.catch(() => undefined).finally(() => (settled = true));

      await jest.advanceTimersByTimeAsync(86_400_000);
      expect(settled).toBe(false);
      await jest.advanceTimersByTimeAsync(2 ** 31);
      await expect(call).rejects.toMatchObject({ name: "TimeoutError" });
    }
  );

  it.each([undefined, 0, -1, NaN])(
    "sets no timer when it is %s",
    async (ms) => {
      stalledFetch();
      const call = createHeliusEager({
        apiKey: "k",
        parsedEventsTimeoutMs: ms,
      }).parsedEvents.parseTransactions({ transactions: [] });
      let settled = false;
      call.catch(() => undefined).finally(() => (settled = true));

      await jest.advanceTimersByTimeAsync(10 * 60_000);
      expect(jest.getTimerCount()).toBe(0);
      expect(settled).toBe(false);
    }
  );
});
