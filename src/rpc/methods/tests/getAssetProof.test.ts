import type { GetAssetProofResponse } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getAssetProof Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches an asset proof by its ID", async () => {
    const mockProof: GetAssetProofResponse = {
      root: "hogwarts-sorting-hat-root",
      proof: ["proof1", "proof2", "proof3"],
      node_index: 1991,
      leaf: "elder-wand-leaf",
      tree_id: "wizarding-tree",
      burnt: false,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockProof,
    });

    const params = { id: "elder-wand-artifact" };
    const result = await rpc.getAssetProof(params);

    expect(result).toEqual(mockProof);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetProof",
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

    await expect(rpc.getAssetProof({ id: "invalid-id" })).rejects.toThrow(
      /Invalid params/
    );
  });
});
