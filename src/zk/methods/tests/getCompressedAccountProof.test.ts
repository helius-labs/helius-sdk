import { createHelius } from "../../../rpc";
import { GetCompressedAccountProofResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedAccountProof Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves the Merkle proof for R2-D2's secret plans", async () => {
    const mockResponse: GetCompressedAccountProofResponse = {
      context: { slot: 123 },
      value: {
        hash: "DeathStarBlueprintHash",
        leafIndex: 1138,
        merkleTree: "DS-Tree-Pubkey",
        proof: ["Hash_0", "Hash_1"],
        root: "RootHashOfImperialSecrets",
        rootSeq: 9000n,
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { hash: "DeathStarBlueprintHash" };
    const result = await helius.zk.getCompressedAccountProof(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedAccountProof",
          params,
        }),
      })
    );
  });

  it("Surfaces RPC errors from the dark side", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "These are not the Merkle leaves…" },
    });

    await expect(
      helius.zk.getCompressedAccountProof({ hash: "BadHash" })
    ).rejects.toThrow(/not the Merkle leaves/i);
  });
});
