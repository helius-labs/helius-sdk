import type {
  AssetsByOwnerRequest,
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

describe("getAssetsByOwner Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches assets owned by an address", async () => {
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
              description: "Highly classified plans.",
              attributes: [{ trait_type: "Security", value: "Top Secret" }],
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

    const params: AssetsByOwnerRequest = {
      ownerAddress: "mofftarkin.sol",
      page: 1,
    };

    const result = await rpc.getAssetsByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByOwner",
          params,
        }),
      })
    );
  });

  it("Fetches assets with pagination, options and sorting", async () => {
    const mockResponse: GetAssetResponseList = {
      grand_total: 20,
      total: 2,
      limit: 2,
      page: 4,
      cursor: "after-cursor",
      items: [],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: AssetsByOwnerRequest = {
      ownerAddress: "mofftarkin.sol",
      page: 4,
      limit: 2,
      before: "before-cursor",
      after: "after-cursor",
      sortBy: {
        sortBy: AssetSortBy.RECENT_ACTION,
        sortDirection: AssetSortDirection.DESC,
      },
    };

    const result = await rpc.getAssetsByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByOwner",
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
      rpc.getAssetsByOwner({ ownerAddress: "invalid-owner" })
    ).rejects.toThrow(/Invalid params/);
  });
});
