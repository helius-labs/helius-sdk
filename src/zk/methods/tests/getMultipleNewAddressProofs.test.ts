import { createHelius } from "../../../rpc";
import { GetMultipleNewAddressProofsResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getMultipleNewAddressProofs Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves proofs that Rebel Alliance wallet addresses are unused", async () => {
    const mockResponse: GetMultipleNewAddressProofsResponse = {
      context: { slot: 1977 },
      value: [
        {
          address: "red-five.sol",
          lowerRangeAddress: "red-four.sol",
          higherRangeAddress: "red-six.sol",
          nextIndex: 42,
          lowElementLeafIndex: 41,
          merkleTree: "Yavin-IV-Tree",
          root: "Death-Star-Plans-Root",
          rootSeq: 9000n,
          proof: ["Hash_0", "Hash_1"],
        },
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const addresses = ["red-five.sol"];
    const result = await helius.zk.getMultipleNewAddressProofs(addresses);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getMultipleNewAddressProofs",
          params: addresses,
        }),
      })
    );
  });

  it("Surfaces RPC errors from the dark side", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Address already in use." },
    });

    await expect(
      helius.zk.getMultipleNewAddressProofs(["empire.sol"])
    ).rejects.toThrow(/already in use/i);
  });
});
