import type { GetAssetProofResponse } from "../../../types";
import { createHelius } from "../..";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    // Helper that mirrors the real one for getAssetProof
    const getAssetProof = (idOrParams: any) => {
      const params =
        typeof idOrParams === "string" ? { id: idOrParams } : idOrParams;
      return request("getAssetProof", params).then((resp: any) => {
        if (resp && resp.error) {
          // Mimic @solana/kit PendingRpcRequest.send()
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getAssetProof };
  }),
}));

describe("getAssetProof Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
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

    mockRequest.mockResolvedValue({ result: mockProof });
    const result = await rpc.getAssetProof({ id: "elder-wand-artifact" });

    expect(result).toEqual(mockProof);
    expect(mockRequest).toHaveBeenCalledWith("getAssetProof", {
      id: "elder-wand-artifact",
    });
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(rpc.getAssetProof({ id: "invalid-id" })).rejects.toThrow(/Invalid params/);
  });
});