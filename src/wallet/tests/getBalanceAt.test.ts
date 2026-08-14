import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetBalanceAtResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getBalanceAt Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves a historical balance by slot", async () => {
    const mockResponse: GetBalanceAtResponse = {
      wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      isNative: false,
      balance: "284961463.392936",
      balanceRaw: "284961463392936",
      decimals: 6,
      requested: {
        time: null,
        slot: 313000000,
        datetime: null,
      },
      asOf: {
        slot: 313000000,
        blockTime: 1736536794,
        signature: "5Cyy7Mh9nVgFq3T8wJp2sKxR4dE6bA1uZoNcLrXmYqUpon",
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getBalanceAt({
      wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      slot: 313000000,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9/balance-at"
      ),
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("slot=313000000"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      ),
      expect.anything()
    );
  });

  it("Passes a datetime query parameter (URL-encoded)", async () => {
    const mockResponse: GetBalanceAtResponse = {
      wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
      mint: "So11111111111111111111111111111111111111111",
      isNative: true,
      balance: "12.5",
      balanceRaw: "12500000000",
      decimals: 9,
      requested: {
        time: 1736536800,
        slot: null,
        datetime: "2025-01-10 19:20:00",
      },
      asOf: null,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getBalanceAt({
      wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
      mint: "So11111111111111111111111111111111111111111",
      datetime: "2025-01-10 19:20:00",
    });

    expect(result.asOf).toBeNull();
    expect(result.isNative).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("datetime=2025-01-10%2019%3A20%3A00"),
      expect.anything()
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        "Exactly one of time, datetime, or slot must be provided",
    });

    await expect(
      rpc.wallet.getBalanceAt({
        wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      })
    ).rejects.toThrow("HTTP error! status: 400");
  });

  it("Handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: "Invalid mint",
        code: 400,
      }),
    });

    await expect(
      rpc.wallet.getBalanceAt({
        wallet: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
        mint: "not-a-mint",
        slot: 313000000,
      })
    ).rejects.toThrow("Helius error:");
  });
});
