import { createHelius } from "../../../rpc";
import { GetCompressionSignaturesForOwnerResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressionSignaturesForOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves signatures that affected Han Solo's compressed riches", async () => {
    const mockResponse: GetCompressionSignaturesForOwnerResponse = {
      context: { slot: 77_000_777 },
      value: {
        cursor: "kessel-run-cursor",
        items: [
          {
            signature: "SoloSig123456789ABCDEFGHIJKLMN",
            slot: 77_000_777,
            blockTime: 1714_081_777,
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
      owner: "SoloPubkey1111111111111111111111111111111111",
      limit: 1,
    };
    const res = await helius.zk.getCompressionSignaturesForOwner(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressionSignaturesForOwner",
          params,
        }),
      })
    );
  });

  it("Bubbles up RPC errors from a Hutt blockade", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Owner address looks suspicious" },
    });

    await expect(
      helius.zk.getCompressionSignaturesForOwner({
        owner: "InvalidOwner",
      })
    ).rejects.toThrow(/suspicious/i);
  });
});
