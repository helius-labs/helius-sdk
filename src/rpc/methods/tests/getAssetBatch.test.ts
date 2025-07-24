import type { Asset } from "../../../types/das";
import { Interface, OwnershipModel } from "../../../types/enums";
import { createHelius } from "../..";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    // Helper that mirrors the real one for getAssetBatch
    const getAssetBatch = (params: any) => {
      return request("getAssetBatch", params).then((resp: any) => {
        if (resp && resp.error) {
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getAssetBatch };
  }),
}));

describe("getAssetBatch Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches assets by their IDs", async () => {
    const mockAssets: Asset[] = [
      {
        interface: Interface.PROGRAMMABLE_NFT,
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
          ownership_model: OwnershipModel.SINGLE,
          owner: "lukeskywalker.sol",
        },
        mutable: true,
        burnt: false,
      },
      {
        interface: Interface.FUNGIBLE_TOKEN,
        id: "death-star-plans-66",
        content: {
          $schema: "jedi-metadata",
          json_uri: "https://starwars.com/death-star.json",
          metadata: {
            name: "Death Star Plans",
            description: "Blueprints for the Empire's superweapon",
            attributes: [{ trait_type: "Security", value: "Classified" }],
            symbol: "DSP",
            token_standard: "Fungible",
          },
          links: {
            image: "https://starwars.com/death-star-plans.png",
          },
        },
        ownership: {
          frozen: false,
          delegated: false,
          ownership_model: OwnershipModel.SINGLE,
          owner: "princessleia.sol",
        },
        mutable: true,
        burnt: false,
        token_info: {
          supply: 1000000000,
          decimals: 9,
          token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      },
    ];

    mockRequest.mockResolvedValue({ result: mockAssets });
    const result = await rpc.getAssetBatch({ ids: ["kyber-crystal-1138", "death-star-plans-66"] });

    expect(result).toEqual(mockAssets);
    expect(mockRequest).toHaveBeenCalledWith("getAssetBatch", { ids: ["kyber-crystal-1138", "death-star-plans-66"] });
  });

  it("Successfully fetches assets with options", async () => {
    const mockAssets: Asset[] = [
      {
        interface: Interface.PROGRAMMABLE_NFT,
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
          ownership_model: OwnershipModel.SINGLE,
          owner: "lukeskywalker.sol",
        },
        mutable: true,
        burnt: false,
      },
      {
        interface: Interface.FUNGIBLE_TOKEN,
        id: "death-star-plans-66",
        content: {
          $schema: "jedi-metadata",
          json_uri: "https://starwars.com/death-star.json",
          metadata: {
            name: "Death Star Plans",
            description: "Blueprints for the Empire's superweapon",
            attributes: [{ trait_type: "Security", value: "Classified" }],
            symbol: "DSP",
            token_standard: "Fungible",
          },
          links: {
            image: "https://starwars.com/death-star-plans.png",
          },
        },
        ownership: {
          frozen: false,
          delegated: false,
          ownership_model: OwnershipModel.SINGLE,
          owner: "princessleia.sol",
        },
        mutable: true,
        burnt: false,
        token_info: {
          supply: 1000000000,
          decimals: 9,
          token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      },
    ];

    mockRequest.mockResolvedValue({ result: mockAssets });
    const result = await rpc.getAssetBatch({
      ids: ["kyber-crystal-1138", "death-star-plans-66"],
      options: { showFungible: true, showUnverifiedCollections: true, showCollectionMetadata: true, showInscription: true },
    });

    expect(result).toEqual(mockAssets);
    expect(mockRequest).toHaveBeenCalledWith("getAssetBatch", {
      ids: ["kyber-crystal-1138", "death-star-plans-66"],
      options: { showFungible: true, showUnverifiedCollections: true, showCollectionMetadata: true, showInscription: true },
    });
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(rpc.getAssetBatch({ ids: ["invalid-id"] })).rejects.toThrow(/Invalid params/);
  });
});