import { createHelius } from "../../../rpc";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getIndexerHealth Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns ok when the compression indexer is healthy", async () => {
    transportMock.mockResolvedValue({ jsonrpc: "2.0", id: "1", result: "ok" });

    const res = await helius.zk.getIndexerHealth();
    expect(res).toBe("ok");
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getIndexerHealth",
          params: {},
        }),
      })
    );
  });

  it("Surfaces indexer-staleness errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32004, message: "Indexer lagging 512 slots" },
    });

    await expect(helius.zk.getIndexerHealth()).rejects.toThrow(/lagging 512/i);
  });
});
