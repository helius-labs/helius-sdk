import { createHelius } from "../../../rpc";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getLatestCompressionSignatures Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Fetches the latest compression signatures", async () => {
    const mockResponse = {
      context: { slot: 12345 },
      value: {
        cursor: "next-cursor",
        items: [
          {
            blockTime: 1714081554,
            signature: "R2D2C3PO…",
            slot: 12345,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const res = await helius.zk.getLatestCompressionSignatures({ limit: 1 });

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getLatestCompressionSignatures",
          params: { limit: 1 },
        }),
      })
    );
  });

  it("Propagates RPC errors from the Dark Side", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32099, message: "Sith interference detected" },
    });

    await expect(helius.zk.getLatestCompressionSignatures()).rejects.toThrow(
      /sith/i
    );
  });
});
