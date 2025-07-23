import type { GetAssetProofBatchResponse } from "../../../types"
import { createHelius } from "../..";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    // Helper that mirrors the real one for getAssetProofBatch
    const getAssetProofBatch = (params: any) => {
      return request("getAssetProofBatch", params).then((resp: any) => {
        if (resp && resp.error) {
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getAssetProofBatch };
  }),
}));

describe("getAssetProofBatch Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches asset proofs for multiple IDs", async () => {
    const mockProofs: GetAssetProofBatchResponse = [
      {
        root: "hogwarts-sorting-hat-root",
        proof: ["proof1", "proof2", "proof3"],
        node_index: 1991,
        leaf: "elder-wand-leaf",
        tree_id: "wizarding-tree",
        burnt: false,
      },
      {
        root: "diagon-alley-root",
        proof: ["proof4", "proof5", "proof6"],
        node_index: 1997,
        leaf: "philosophers-stone-leaf",
        tree_id: "hallows-tree",
        burnt: false,
      },
    ];

    mockRequest.mockResolvedValue({ result: mockProofs });
    const result = await rpc.getAssetProofBatch({ ids: ["elder-wand-artifact", "philosophers-stone-artifact"] });

    expect(result).toEqual(mockProofs);
    expect(mockRequest).toHaveBeenCalledWith("getAssetProofBatch", {
      ids: ["elder-wand-artifact", "philosophers-stone-artifact"],
    });
  });

  it("Handles empty ID array", async () => {
    const mockProofs: GetAssetProofBatchResponse = [];

    mockRequest.mockResolvedValue({ result: mockProofs });
    const result = await rpc.getAssetProofBatch({ ids: [] });

    expect(result).toEqual(mockProofs);
    expect(mockRequest).toHaveBeenCalledWith("getAssetProofBatch", { ids: [] });
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(rpc.getAssetProofBatch({ ids: ["invalid-id"] })).rejects.toThrow(/Invalid params/);
  });
});