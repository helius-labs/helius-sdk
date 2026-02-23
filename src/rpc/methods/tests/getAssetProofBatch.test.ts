import type { GetAssetProofBatchResponse } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getAssetProofBatch Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches asset proofs for multiple IDs", async () => {
    const mockProofs: GetAssetProofBatchResponse = {
      "elder-wand-artifact": {
        root: "hogwarts-sorting-hat-root",
        proof: ["proof1", "proof2", "proof3"],
        node_index: 1991,
        leaf: "elder-wand-leaf",
        tree_id: "wizarding-tree",
        burnt: false,
      },
      "philosophers-stone-artifact": {
        root: "diagon-alley-root",
        proof: ["proof4", "proof5", "proof6"],
        node_index: 1997,
        leaf: "philosophers-stone-leaf",
        tree_id: "hallows-tree",
        burnt: false,
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockProofs,
    });

    const params = {
      ids: ["elder-wand-artifact", "philosophers-stone-artifact"],
    };

    const result = await rpc.getAssetProofBatch(params);

    expect(result).toEqual(mockProofs);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetProofBatch",
          params,
        }),
      })
    );
  });

  it("Handles empty ID array", async () => {
    const mockProofs: GetAssetProofBatchResponse = {};

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockProofs,
    });

    const params = { ids: [] };
    const result = await rpc.getAssetProofBatch(params);

    expect(result).toEqual(mockProofs);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetProofBatch",
          params,
        }),
      })
    );
  });

  it("Handles RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getAssetProofBatch({ ids: ["invalid-id"] })
    ).rejects.toThrow(/Invalid params/);
  });
});
