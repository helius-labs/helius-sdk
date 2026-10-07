import { createHelius } from "../../rpc";
import { createHeliusEager } from "../../rpc/createHelius.eager";
import { makeParsedEventsClient } from "../client";
import { makeParsedEventsClientEager } from "../client.eager";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const MAINNET_ONLY = "Parsed Events is only available on mainnet.";

describe("parsedEvents namespace Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Lazily loads methods and calls the API", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    // The lazy namespace proxy returns a function for any key, so check the
    // real clients' surfaces directly
    const methods = ["getTransactionHistory", "parseTransactions"];
    expect(Object.keys(makeParsedEventsClient("k")).sort()).toEqual(methods);
    expect(Object.keys(makeParsedEventsClientEager("k")).sort()).toEqual(
      methods
    );

    const helius = createHelius({ apiKey: "test-key" });

    await expect(
      helius.parsedEvents.parseTransactions({ transactions: [] })
    ).resolves.toEqual([]);
    expect(mockFetch.mock.calls[0][0]).toMatch(
      /\/v1\/parsed-events\/transactions\?/
    );
  });

  it("Rejects without an API key", async () => {
    const helius = createHelius({});
    await expect(
      helius.parsedEvents.parseTransactions({ transactions: [] })
    ).rejects.toThrow("An API key is required to use Parsed Events");
    expect(() => createHeliusEager({}).parsedEvents).toThrow(
      "An API key is required to use Parsed Events"
    );
  });

  it.each([
    ["network: devnet", { network: "devnet" as const }],
    ["devnet baseUrl", { baseUrl: "https://devnet.helius-rpc.com/" }],
    [
      "devnet host with trailing dot",
      { baseUrl: "https://devnet.helius-rpc.com./" },
    ],
    ["non-Helius devnet host", { baseUrl: "https://api.devnet.solana.com/" }],
    [
      "devnet Secure RPC host",
      { baseUrl: "https://abc-fast-devnet.helius-rpc.com/" },
    ],
    [
      "network: devnet with a custom baseUrl",
      { network: "devnet" as const, baseUrl: "https://proxy.example.com/" },
    ],
  ])(
    "Rejects calls on devnet (%s) instead of querying mainnet",
    async (_label, opts) => {
      // Every method on both clients must reject, including on a bare read
      // of the namespace (reading must not throw)
      for (const { parsedEvents } of [
        createHelius({ apiKey: "test-key", ...opts }),
        createHeliusEager({ apiKey: "test-key", ...opts }),
        { parsedEvents: makeParsedEventsClient("test-key", opts) },
      ]) {
        await expect(
          parsedEvents.parseTransactions({ transactions: [] })
        ).rejects.toThrow(MAINNET_ONLY);
        await expect(
          parsedEvents.getTransactionHistory({ address: "x" })
        ).rejects.toThrow(MAINNET_ONLY);
      }

      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it("Standalone lazy client loads once and serves both methods", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    const client = makeParsedEventsClient("test-key");
    await client.parseTransactions({ transactions: [] });
    await client.getTransactionHistory({ address: "x" });

    expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
      "https://mainnet.helius-rpc.com/v1/parsed-events/transactions?api-key=test-key",
      "https://mainnet.helius-rpc.com/v1/parsed-events/transaction-history?api-key=test-key",
    ]);
  });

  it("Treats a non-devnet custom baseUrl as mainnet", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    for (const helius of [
      createHelius({ apiKey: "k", baseUrl: "https://beta.helius-rpc.com/" }),
      createHeliusEager({ apiKey: "k", baseUrl: "https://rpc.example.com/" }),
    ]) {
      await expect(
        helius.parsedEvents.parseTransactions({ transactions: [] })
      ).resolves.toEqual([]);
    }
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
