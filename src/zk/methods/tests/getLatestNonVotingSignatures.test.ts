import { createHelius } from "../../../rpc";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getLatestNonVotingSignatures Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns recent non-voting signatures", async () => {
    const mockResponse = {
      context: { slot: 424242 },
      value: {
        items: [
          {
            signature: "HAN-SHOT-FIRST",
            slot: 424242,
            blockTime: 1714081554,
            error: null,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const res = await helius.zk.getLatestNonVotingSignatures({ limit: 1 });

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getLatestNonVotingSignatures",
          params: { limit: 1 },
        }),
      })
    );
  });

  it("Bubbles up RPC errors from the Imperial network", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32000, message: "Imperial jammer detected" },
    });

    await expect(helius.zk.getLatestNonVotingSignatures()).rejects.toThrow(
      /jammer/i
    );
  });
});
