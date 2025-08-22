import type {
  AssetsByGroupRequest,
  GetAssetResponseList,
} from "../../../types/das";
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

describe("getAssetsByGroup Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches assets by group (e.g. collection)", async () => {
    const mockResponse: GetAssetResponseList = {
      total: 1,
      limit: 1000,
      page: 1,
      items: [
        {
          interface: Interface.PROGRAMMABLE_NFT,
          id: "death-star-plans",
          content: {
            $schema: "empire-metadata",
            json_uri: "https://empire.gov/ds-plans.json",
            metadata: {
              name: "Death Star Superlaser Schematics",
              description:
                "Highly classified plans detailing the planet-destroying superlaser.",
              attributes: [
                { trait_type: "Security", value: "Imperial Top-Secret" },
              ],
              symbol: "DSTAR",
              token_standard: "nonFungible",
            },
            links: { image: "https://empire.gov/death-star.png" },
          },
          ownership: {
            frozen: false,
            delegated: false,
            ownership_model: OwnershipModel.SINGLE,
            owner: "mofftarkin.sol",
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

    const params: AssetsByGroupRequest = {
      groupKey: "collection",
      groupValue: "empire-collection",
      page: 1,
    };

    const result = await rpc.getAssetsByGroup(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByGroup",
          params,
        }),
      })
    );
  });

  it("Fetches assets by group with pagination, options, and sorting", async () => {
    const mockResponse: GetAssetResponseList = {
      grand_total: 42,
      total: 2,
      limit: 2,
      page: 3,
      cursor: "after-cursor",
      items: [],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: AssetsByGroupRequest = {
      groupKey: "collection",
      groupValue: "empire-collection",
      page: 3,
      limit: 2,
      before: "before-cursor",
      after: "after-cursor",
      options: {
        showCollectionMetadata: true,
        showGrandTotal: true,
        showRawData: true,
        showFungible: true,
        requireFullIndex: true,
        showSystemMetadata: true,
      },
      sortBy: {
        sortBy: AssetSortBy.RECENT_ACTION,
        sortDirection: AssetSortDirection.DESC,
      },
    };

    const result = await rpc.getAssetsByGroup(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByGroup",
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
      rpc.getAssetsByGroup({ groupKey: "collection", groupValue: "invalid" })
    ).rejects.toThrow(/Invalid params/);
  });
});
