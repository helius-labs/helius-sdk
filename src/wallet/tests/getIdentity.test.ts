import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetIdentityResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getIdentity Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves wallet identity", async () => {
    const mockResponse: GetIdentityResponse = {
      address: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
      type: "exchange",
      name: "Binance 1",
      category: "Centralized Exchange",
      tags: ["Centralized Exchange"],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getIdentity({
      wallet: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/wallet/HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664/identity"
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
      text: async () => "Wallet identity not found",
    });

    await expect(
      rpc.wallet.getIdentity({
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
      rpc.wallet.getIdentity({
        wallet: "invalid-wallet",
      })
    ).rejects.toThrow("Helius error:");
  });
});
