import { createHelius } from "../../../rpc";
import { GetMultipleNewAddressProofsV2Response } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getMultipleNewAddressProofsV2 Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves proofs for unclaimed (address, tree) pairs", async () => {
    const mockResponse: GetMultipleNewAddressProofsV2Response = {
      context: { slot: 4242 },
      value: [
        {
          address: "AddrV2",
          lowerRangeAddress: "AddrLow",
          higherRangeAddress: "AddrHigh",
          nextIndex: 7,
          lowElementLeafIndex: 6,
          merkleTree: "TreeXYZ",
          root: "RootHash",
          rootSeq: 1n,
          proof: ["HashA", "HashB"],
        },
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = [{ address: "AddrV2", tree: "TreeXYZ" }];
    const result = await helius.zk.getMultipleNewAddressProofsV2(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getMultipleNewAddressProofsV2",
          params,
        }),
      })
    );
  });

  it("Surfaces RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "tree mismatch" },
    });

    await expect(
      helius.zk.getMultipleNewAddressProofsV2([
        { address: "Bad", tree: "TreeXYZ" },
      ])
    ).rejects.toThrow(/tree mismatch/i);
  });
});
