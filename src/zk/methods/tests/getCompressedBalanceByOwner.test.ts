import { createHelius } from "../../../rpc";
import type { GetCompressedBalanceByOwnerResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedBalanceByOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns total lamports in the Rebel Alliance treasury", async () => {
    const mockResponse: GetCompressedBalanceByOwnerResponse = {
      context: { slot: 321_1977 },
      value: 1_000_000_000,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { owner: "RebelAlliancePubkey" };
    const result = await helius.zk.getCompressedBalanceByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedBalanceByOwner",
          params,
        }),
      })
    );
  });

  it("Bubbles up RPC errors from the Sith accountants", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Balance sheet corrupted by Jawas" },
    });

    await expect(
      helius.zk.getCompressedBalanceByOwner({ owner: "BadPubkey" })
    ).rejects.toThrow(/Jawas/);
  });
});
