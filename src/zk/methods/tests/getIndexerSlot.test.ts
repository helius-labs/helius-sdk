import { createHelius } from "../../../rpc";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getIndexerSlot Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns the latest indexed slot", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: 123456,
    });

    const slot = await helius.zk.getIndexerSlot();
    expect(slot).toBe(123456);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getIndexerSlot",
          params: {},
        }),
      })
    );
  });

  it("Bubbles up RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32004, message: "Indexer unavailable" },
    });

    await expect(helius.zk.getIndexerSlot()).rejects.toThrow(/unavailable/i);
  });
});
