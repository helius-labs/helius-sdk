import type { GetAssetResponseList } from "../../../types/das";
import {
  Interface,
  OwnershipModel,
  AssetSortBy,
  AssetSortDirection,
} from "../../../types";
import { createHelius } from "../..";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    const getAssetsByCreator = (params: any) =>
      request("getAssetsByCreator", params).then((resp: any) => {
        if (resp && resp.error) {
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });

    return { request, getAssetsByCreator };
  }),
}));

describe("getAssetsByCreator Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
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
              attributes: [{ trait_type: "Security", value: "Imperial Top-Secret" }],
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

    mockRequest.mockResolvedValue({ result: mockResponse });

    const result = await rpc.getAssetsByCreator({
      creatorAddress: "galacticempire.sol",
      page: 1,
    });

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith("getAssetsByCreator", {
      creatorAddress: "galacticempire.sol",
      page: 1,
    });
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

    mockRequest.mockResolvedValue({ result: mockResponse });

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
    expect(mockRequest).toHaveBeenCalledWith("getAssetsByCreator", params);
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getAssetsByCreator({ creatorAddress: "invalid-empire" }),
    ).rejects.toThrow(/Invalid params/);
  });
});
