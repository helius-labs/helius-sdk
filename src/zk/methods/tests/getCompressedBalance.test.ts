import { createHelius } from "../../../rpc";
import type { GetCompressedBalanceResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedBalance Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns the balance of Han Solo's smuggled account", async () => {
    const mockResponse: GetCompressedBalanceResponse = {
      context: { slot: 12345 },
      value: 777_000,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { hash: "ParsecsKesselRunHash" };
    const result = await helius.zk.getCompressedBalance(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedBalance",
          params,
        }),
      })
    );
  });

  it("Propagates Imperial error codes", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "That's no valid hash…" },
    });

    await expect(
      helius.zk.getCompressedBalance({ hash: "BadHash" })
    ).rejects.toThrow(/no valid hash/i);
  });
});
