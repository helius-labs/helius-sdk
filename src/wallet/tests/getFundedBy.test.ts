import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetFundedByResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getFundedBy Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves wallet funding source", async () => {
    const mockResponse: GetFundedByResponse = {
      funder: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S",
      funderName: "Coinbase 2",
      funderType: "exchange",
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      amount: 0.05,
      amountRaw: "50000000",
      decimals: 9,
      signature:
        "5wHu1qwD7Jsj3xqWjdSEJmYr3Q5f5RjXqjqQJ7jqEj7jqEj7jqEj7jqEj7jqEj7jqE",
      timestamp: 1704067200,
      date: "2024-01-01T00:00:00.000Z",
      slot: 250000000,
      explorerUrl:
        "https://orbmarkets.io/tx/5wHu1qwD7Jsj3xqWjdSEJmYr3Q5f5RjXqjqQJ7jqEj7jqEj7jqEj7jqEj7jqEj7jqE",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getFundedBy({
      wallet: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY/funded-by"
      ),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "No funding transaction found",
    });

    await expect(
      rpc.wallet.getFundedBy({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("HTTP error! status: 404");
  });

  it("Handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: 404, message: "No funding transaction found" },
      }),
    });

    await expect(
      rpc.wallet.getFundedBy({
        wallet: "new-wallet",
      })
    ).rejects.toThrow("Helius error:");
  });
});
