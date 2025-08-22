import { createHelius } from "../../../rpc";
import { GetCompressionSignaturesForTokenOwnerResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressionSignaturesForTokenOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves signatures that altered Princess Leia's token cache", async () => {
    const mockResponse: GetCompressionSignaturesForTokenOwnerResponse = {
      context: { slot: 42 },
      value: {
        cursor: "help-me-obi-wan",
        items: [
          {
            signature: "LeiaSigABCDE123456789",
            slot: 42,
            blockTime: 1_714_081_554,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = {
      owner: "LeiaPubkey1111111111111111111111111111111111111",
      limit: 1,
    };
    const res = await helius.zk.getCompressionSignaturesForTokenOwner(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressionSignaturesForTokenOwner",
          params,
        }),
      })
    );
  });

  it("Propagates RPC errors from an Imperial probe droid", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid token owner address" },
    });

    await expect(
      helius.zk.getCompressionSignaturesForTokenOwner({
        owner: "BadOwner",
      })
    ).rejects.toThrow(/Invalid token owner address/i);
  });
});
