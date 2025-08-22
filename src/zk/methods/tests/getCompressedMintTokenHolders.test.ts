import { createHelius } from "../../../rpc";
import type { GetCompressedMintTokenHoldersResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedMintTokenHolders Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns top Ewok token holders (descending)", async () => {
    const mockResponse: GetCompressedMintTokenHoldersResponse = {
      context: { slot: 42_4242 },
      value: {
        cursor: "NextCursor",
        items: [
          { owner: "ChiefChirpaPubkey", balance: 1_000_000 },
          { owner: "WicketWPubkey", balance: 750_000 },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { mint: "EwokMintAddress", limit: 2 };
    const result = await helius.zk.getCompressedMintTokenHolders(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedMintTokenHolders",
          params,
        }),
      })
    );
  });

  it("Propagates RPC errors from Imperial spies", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Mint not found on Endor" },
    });

    await expect(
      helius.zk.getCompressedMintTokenHolders({ mint: "BadMint" })
    ).rejects.toThrow(/Mint not found/);
  });
});
