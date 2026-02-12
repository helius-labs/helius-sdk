import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetTransfersResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getTransfers Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves wallet transfers", async () => {
    const mockResponse: GetTransfersResponse = {
      data: [
        {
          signature: "5wHu1qwD7Jsj3xqWjdSEJmYr3Q5f5RjXqjqQJ7jqEj7jqEj7jqEj7jqEj7jqEj7jqE",
          timestamp: 1704067200,
          direction: "in",
          counterparty: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          amount: 1.5,
          amountRaw: "1500000000",
          decimals: 9,
        },
      ],
      pagination: {
        hasMore: true,
        nextCursor: "cursor123",
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getTransfers({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      limit: 50,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY/transfers"
      ),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("Handles pagination with cursor", async () => {
    const mockResponse: GetTransfersResponse = {
      data: [],
      pagination: {
        hasMore: false,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await rpc.wallet.getTransfers({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      cursor: "cursor123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("cursor=cursor123"),
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
      rpc.wallet.getTransfers({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("HTTP error! status: 404");
  });

  it("Handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: 400, message: "Invalid parameters" },
      }),
    });

    await expect(
      rpc.wallet.getTransfers({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("Helius error:");
  });
});
