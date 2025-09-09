import type { GetAssetResponseList } from "../../../types/das";
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

describe("getAssetsByCreator Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches assets forged by the Galactic Empire", async () => {
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
          creators: [
            {
              address: "galacticempire.sol",
              share: 100,
              verified: true,
            },
          ],
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

    const params = { creatorAddress: "galacticempire.sol", page: 1 };
    const result = await rpc.getAssetsByCreator({
      creatorAddress: "galacticempire.sol",
      page: 1,
    });

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByCreator",
          params,
        }),
      })
    );
  });

  it("Fetches verified Imperial assets with pagination, options and sorting", async () => {
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

    const params = {
      creatorAddress: "galacticempire.sol",
      onlyVerified: true,
      page: 4,
      limit: 2,
      before: "before-cursor",
      after: "after-cursor",
      options: {
        showCollectionMetadata: true,
        showGrandTotal: true,
      },
      sortBy: {
        sortBy: AssetSortBy.RECENT_ACTION,
        sortDirection: AssetSortDirection.DESC,
      },
    } as const;

    const result = await rpc.getAssetsByCreator(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getAssetsByCreator",
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
      rpc.getAssetsByCreator({ creatorAddress: "invalid-empire" })
    ).rejects.toThrow(/Invalid params/);
  });
});
