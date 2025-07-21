import type { Asset } from "../../../types/das";
import { Interface, OwnershipModel } from "../../../types/das";
import { createHeliusRpc } from "../..";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    // Helper that mirrors the real one
    const getAsset = (idOrParams: any) => {
      const params =
        typeof idOrParams === "string" ? { id: idOrParams } : idOrParams;
      return request("getAsset", params).then((resp: any) => {
        if (resp && resp.error) {
          // Mimic @solana/kit PendingRpcRequest.send()
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getAsset };
  }),
}));

describe("getAsset Tests", () => {
  let rpc: ReturnType<typeof createHeliusRpc>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHeliusRpc({ apiKey: "test-key" });
  });

  it("Successfully fetches an asset by its ID", async () => {
    const mockAsset: Asset = {
      interface: Interface.ProgrammableNFT,
      id: "kyber-crystal-1138",
      content: {
        $schema: "jedi-metadata",
        json_uri: "https://starwars.com/kyber.json",
        metadata: {
          name: "Luke's Lightsaber",
          description: "A weapon for a more civilized age",
          attributes: [{ trait_type: "Color", value: "Green" }],
          symbol: "SABER",
          token_standard: "nonFungible",
        },
        links: {
          image: "https://starwars.com/lightsaber.png",
        },
      },
      ownership: {
        frozen: false,
        delegated: false,
        ownership_model: OwnershipModel.Single,
        owner: "lukeskywalker.sol",
      },
      mutable: true,
      burnt: false,
    };

    mockRequest.mockResolvedValue({ result: mockAsset });
    const result = await rpc.getAsset("kyber-crystal-1138");

    expect(result).toEqual(mockAsset);
    expect(mockRequest).toHaveBeenCalledWith("getAsset", {
      id: "kyber-crystal-1138",
    });
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(rpc.getAsset("invalid-id")).rejects.toThrow(/Invalid params/);
  });
});
