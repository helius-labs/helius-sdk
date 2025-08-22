import type { Asset } from "../../../types/das";
import { Interface, OwnershipModel } from "../../../types/enums";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}), // we don't use PendingRpcRequest anymore
}));

describe("getAssetBatch Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
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
          links: { image: "https://starwars.com/lightsaber.png" },
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
          links: { image: "https://starwars.com/death-star-plans.png" },
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

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockAssets,
    });

    const params = { ids: ["kyber-crystal-1138", "death-star-plans-66"] };
    const result = await rpc.getAssetBatch(params);

    expect(result).toEqual(mockAssets);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetBatch",
          params,
        }),
      })
    );
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
          supply: 1_000_000_000,
          decimals: 9,
          token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      },
    ];

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockAssets,
    });

    const params = {
      ids: ["kyber-crystal-1138", "death-star-plans-66"],
      options: {
        showFungible: true,
        showUnverifiedCollections: true,
        showCollectionMetadata: true,
        showInscription: true,
      },
    };

    const result = await rpc.getAssetBatch(params);

    expect(result).toEqual(mockAssets);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetBatch",
          params: params,
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

    await expect(rpc.getAssetBatch({ ids: ["invalid-id"] })).rejects.toThrow(
      /Invalid params/
    );
  });
});
