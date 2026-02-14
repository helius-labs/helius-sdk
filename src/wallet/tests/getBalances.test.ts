import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetBalancesResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getBalances Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves wallet balances", async () => {
    const mockResponse: GetBalancesResponse = {
      balances: [
        {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          name: "Solana",
          balance: 1.5,
          decimals: 9,
          pricePerToken: 145.32,
          usdValue: 217.98,
          logoUri: "https://example.com/sol.png",
          tokenProgram: "spl-token",
        },
      ],
      totalUsdValue: 217.98,
      pagination: {
        page: 1,
        limit: 100,
        hasMore: false,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getBalances({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY/balances"
      ),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("Handles pagination parameters", async () => {
    const mockResponse: GetBalancesResponse = {
      balances: [],
      totalUsdValue: 0,
      pagination: {
        page: 2,
        limit: 50,
        hasMore: true,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await rpc.wallet.getBalances({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      page: 2,
      limit: 50,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("limit=50"),
      expect.anything()
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Wallet not found",
    });

    await expect(
      rpc.wallet.getBalances({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("HTTP error! status: 404");
  });

  it("Handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: 400, message: "Invalid wallet address" },
      }),
    });

    await expect(
      rpc.wallet.getBalances({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("Helius error:");
  });
});
