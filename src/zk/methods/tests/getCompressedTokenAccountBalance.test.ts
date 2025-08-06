import { createHelius } from "../../../rpc";
import type { GetCompressedTokenAccountBalanceResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedTokenAccountBalance Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns balance for Amidala's secret token account", async () => {
    const mockResponse: GetCompressedTokenAccountBalanceResponse = {
      context: { slot: 1_234_567 },
      value: { amount: 327 },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { hash: "AmidalaHash11111111111111111111111111111" };
    const res = await helius.zk.getCompressedTokenAccountBalance(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedTokenAccountBalance",
          params,
        }),
      })
    );
  });

  it("Propagates trade federation RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Blockade! Invalid token account" },
    });

    await expect(
      helius.zk.getCompressedTokenAccountBalance({ address: "BadPDA" })
    ).rejects.toThrow(/Blockade/i);
  });
});
