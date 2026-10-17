import { createHelius } from "../../rpc";
import { createHeliusEager } from "../../rpc/createHelius.eager";

const DEVNET_BASE = "https://api-devnet.helius.xyz/v0";
const MAINNET_BASE = "https://api-mainnet.helius-rpc.com/v0";

describe("Enhanced Lazy Namespace Test", () => {
  it("Exposes functions lazily", async () => {
    const helius = createHelius({ apiKey: "test" });
    expect(typeof helius.enhanced.getTransactions).toBe("function");
  });
});

describe("Enhanced network routing", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, text: async () => "[]" });
  });

  const urlsFor = async (opts: Parameters<typeof createHelius>[0]) => {
    for (const helius of [createHelius(opts), createHeliusEager(opts)]) {
      await helius.enhanced.getTransactions({ transactions: [] });
      await helius.enhanced.getTransactionsByAddress({ address: "x" });
    }
    return fetchMock.mock.calls.map(([url]) => url as string);
  };

  it.each([
    ["network: devnet", { network: "devnet" as const }],
    ["devnet baseUrl", { baseUrl: "https://devnet.helius-rpc.com/" }],
    [
      "devnet Secure RPC host",
      { baseUrl: "https://abc-fast-devnet.helius-rpc.com/" },
    ],
  ])("Queries the devnet API on devnet (%s)", async (_label, opts) => {
    const urls = await urlsFor({ apiKey: "test-key", ...opts });

    expect(urls).toHaveLength(4);
    for (const url of urls) expect(url).toContain(`${DEVNET_BASE}/`);
  });

  it("Queries the mainnet API for a non-devnet baseUrl", async () => {
    const urls = await urlsFor({
      apiKey: "test-key",
      baseUrl: "https://rpc.example.com/",
    });

    expect(urls).toHaveLength(4);
    for (const url of urls) expect(url).toContain(`${MAINNET_BASE}/`);
  });
});
