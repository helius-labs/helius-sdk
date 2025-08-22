import { createHelius } from "../../../rpc";
import { GetCompressionSignaturesForAddressResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressionSignaturesForAddress Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns paginated signatures for Princess Leia's wallet", async () => {
    const mockResponse: GetCompressionSignaturesForAddressResponse = {
      context: { slot: 66_000_000 },
      value: {
        cursor: "next-cursor-to-Endor",
        items: [
          {
            signature: "OrganaSig999999999999999999999999999999999999",
            slot: 66_000_000,
            blockTime: 1714_081_555,
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
      address: "LeiaPubkey11111111111111111111111111111111111",
      limit: 1,
    };
    const res = await helius.zk.getCompressionSignaturesForAddress(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressionSignaturesForAddress",
          params,
        }),
      })
    );
  });

  it("Propagates Sith-spawned RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Address lies beyond the Outer Rim" },
    });

    await expect(
      helius.zk.getCompressionSignaturesForAddress({
        address: "BadAddress",
      })
    ).rejects.toThrow(/Outer Rim/i);
  });
});
