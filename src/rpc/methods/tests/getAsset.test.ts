import type { Asset } from "../../../types/das";
import { Interface, OwnershipModel } from "../../../types/enums";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getAsset Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches an asset by its ID", async () => {
    const mockAsset: Asset = {
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
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockAsset,
    });

    const params = { id: "kyber-crystal-1138" };
    const result = await rpc.getAsset(params);

    expect(result).toEqual(mockAsset);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAsset",
          params,
        }),
      })
    );
  });

  it("Successfully fetches an asset with options", async () => {
    const mockAsset: Asset = {
      interface: Interface.FUNGIBLE_TOKEN,
      id: "kyber-crystal-1138",
      content: {
        $schema: "jedi-metadata",
        json_uri: "https://starwars.com/kyber.json",
        metadata: {
          name: "Kyber Crystal",
          description:
            "Power source for lightsabers, a rare Force-attuned crystal",
          attributes: [{ trait_type: "Rarity", value: "Legendary" }],
          symbol: "KYBER",
          token_standard: "Fungible",
        },
        links: {
          image: "https://starwars.com/kyber-crystal.png",
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
      token_info: {
        supply: 1_000_000_000,
        decimals: 9,
        token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockAsset,
    });

    const params = {
      id: "kyber-crystal-1138",
      options: { showFungible: true },
    } as const;

    const result = await rpc.getAsset(params);

    expect(result).toEqual(mockAsset);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAsset",
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

    await expect(rpc.getAsset({ id: "invalid-id" })).rejects.toThrow(
      /Invalid params/
    );
  });
});
