import { createHelius } from "../../../rpc";
import { GetCompressedTokenBalancesByOwnerResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedTokenBalancesByOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns Han Solo's smuggled token balances", async () => {
    const mockResponse: GetCompressedTokenBalancesByOwnerResponse = {
      context: { slot: 777_777 },
      value: {
        cursor: "KesselCursor",
        token_balances: [
          {
            mint: "SpiceMint1111111111111111111111111111111",
            balance: 12,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { owner: "HanSoloWallet1111111111111111111111" };
    const result = await helius.zk.getCompressedTokenBalancesByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedTokenBalancesByOwner",
          params,
        }),
      })
    );
  });

  it("Propagates Imperial-era RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32000, message: "Millennium Falcon impounded" },
    });

    await expect(
      helius.zk.getCompressedTokenBalancesByOwner({
        owner: "FalconWallet00000000000000000000000",
      })
    ).rejects.toThrow(/impounded/i);
  });
});
