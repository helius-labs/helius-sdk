import { GetAssetResponseList, } from "../../../types/das";
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

    // Helper that mirrors the real RPC wrapper
    const getAssetsByAuthority = (params: any) => {
      return request("getAssetsByAuthority", params).then((resp: any) => {
        if (resp && resp.error) {
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getAssetsByAuthority };
  }),
}));

describe("getAssetsByAuthority Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches assets by authority address", async () => {
    const mockResponse: GetAssetResponseList = {
      grand_total: 2,
      total: 2,
      limit: 1000,
      page: 1,
      items: [
        {
          interface: Interface.PROGRAMMABLE_NFT,      
          id: "elder-wand-artifact",
          content: {
            $schema: "wizard-metadata",
            json_uri: "https://harrypotter.com/elder-wand.json",
            metadata: {
              name: "Elder Wand",
              description: "The most powerful wand in existence",
              attributes: [{ trait_type: "Power", value: "Unmatched" }],
              symbol: "ELDER",
              token_standard: "nonFungible",
            },
            links: {
              image: "https://harrypotter.com/elder-wand.png",
            },
          },
          ownership: {
            frozen: false,
            delegated: false,
            ownership_model: OwnershipModel.SINGLE,
            owner: "albusdumbledore.sol",
          },
          mutable: true,
          burnt: false,
        },
        {
          interface: Interface.FUNGIBLE_TOKEN,
          id: "galleon-coin",
          content: {
            $schema: "wizard-metadata",
            json_uri: "https://harrypotter.com/galleon.json",
            metadata: {
              name: "Galleon Coin",
              description: "Golden currency used in the wizarding world",
              attributes: [{ trait_type: "Value", value: "High" }],
              symbol: "GALLEON",
              token_standard: "Fungible",
            },
            links: {
              image: "https://harrypotter.com/galleon-coin.png",
            },
          },
          ownership: {
            frozen: false,
            delegated: false,
            ownership_model: OwnershipModel.SINGLE,
            owner: "albusdumbledore.sol",
          },
          mutable: true,
          burnt: false,
          token_info: {
            supply: 1_000_000_000,
            decimals: 0,
            token_program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          },
        },
      ],
      nativeBalance: {
        lamports: 1_000_000_000,
        price_per_sol: 100,
        total_price: 1_000_000_000,
      },
    };

    mockRequest.mockResolvedValue({ result: mockResponse });

    const result = await rpc.getAssetsByAuthority({
      authorityAddress: "albusdumbledore.sol",
    });

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith("getAssetsByAuthority", {
      authorityAddress: "albusdumbledore.sol",
    });
  });

  it("Successfully fetches assets with pagination, options, and sorting", async () => {
    const mockResponse: GetAssetResponseList = {
      grand_total: 3,
      total: 3,
      limit: 5,
      page: 2,
      cursor: "next-page-cursor",
      items: [],
      nativeBalance: {
        lamports: 2_000_000_000,
        price_per_sol: 150,
        total_price: 3_000_000_000,
      },
    };

    mockRequest.mockResolvedValue({ result: mockResponse });

    const params = {
      authorityAddress: "albusdumbledore.sol",
      page: 2,
      limit: 5,
      before: "previous-cursor",
      after: "next-cursor",
      options: {
        showUnverifiedCollections: true,
        showCollectionMetadata: true,
        showGrandTotal: true,
        showRawData: true,
        showFungible: true,
        requireFullIndex: true,
        showSystemMetadata: true,
        showZeroBalance: true,
        showClosedAccounts: true,
        showNativeBalance: true,
      },
      sortBy: {
        sortBy: AssetSortBy.CREATED,
        sortDirection: AssetSortDirection.ASC,
      },
    } as const;

    const result = await rpc.getAssetsByAuthority(params);

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith("getAssetsByAuthority", params);
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getAssetsByAuthority({ authorityAddress: "invalid-authority" }),
    ).rejects.toThrow(/Invalid params/);
  });
});
