import { SearchAssetsRequest, GetAssetResponseList } from "../../../types/das";
import {
  Interface,
  OwnershipModel,
  AssetSortBy,
  AssetSortDirection,
} from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("searchAssets Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Searches for compressed Jedi holocrons owned by Luke with a specific trait", async () => {
    const mockResponse: GetAssetResponseList = {
      total: 1,
      limit: 100,
      page: 1,
      items: [
        {
          interface: Interface.PROGRAMMABLE_NFT,
          id: "holocron-1138",
          content: {
            $schema: "jedi-holocron",
            json_uri: "https://starwars.example/holocron/1138.json",
            metadata: {
              name: "Jedi Holocron - Luke's Teachings",
              description: "Ancient Jedi knowledge recorded by Luke Skywalker.",
              attributes: [{ trait_type: "Era", value: "New Republic" }],
              symbol: "HOLO",
              token_standard: "nonFungible",
            },
            links: { image: "https://starwars.example/img/holocron-1138.png" },
          },
          ownership: {
            frozen: false,
            delegated: false,
            ownership_model: OwnershipModel.SINGLE,
            owner: "lukeskywalker.sol",
          },
          mutable: false,
          burnt: false,
        },
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: SearchAssetsRequest = {
      ownerAddress: "lukeskywalker.sol",
      compressed: true,
      page: 1,
      limit: 100,
      sortBy: {
        sortBy: AssetSortBy.RECENT_ACTION,
        sortDirection: AssetSortDirection.DESC,
      },
    };

    const result = await rpc.searchAssets(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "searchAssets",
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
      rpc.searchAssets({ ownerAddress: "palpatine.invalid" })
    ).rejects.toThrow(/Invalid params/);
  });
});
