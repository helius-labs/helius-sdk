import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetHistoryResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getHistory Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves wallet history", async () => {
    const mockResponse: GetHistoryResponse = {
      data: [
        {
          signature: "5wHu1qwD7Jsj3xqWjdSEJmYr3Q5f5RjXqjqQJ7jqEj7jqEj7jqEj7jqEj7jqEj7jqE",
          timestamp: 1704067200,
          slot: 250000000,
          fee: 0.000005,
          feePayer: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
          error: null,
          balanceChanges: [
            {
              mint: "SOL",
              amount: -0.5,
              decimals: 9,
            },
          ],
        },
      ],
      pagination: {
        hasMore: true,
        nextCursor: "abc123",
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getHistory({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      limit: 50,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY/history"
      ),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("Handles pagination with before cursor", async () => {
    const mockResponse: GetHistoryResponse = {
      data: [],
      pagination: {
        hasMore: false,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await rpc.wallet.getHistory({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      before: "cursor123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("before=cursor123"),
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
      rpc.wallet.getHistory({
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
      rpc.wallet.getHistory({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("Helius error:");
  });
});
