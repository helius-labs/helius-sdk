import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetBatchIdentityResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getBatchIdentity Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully retrieves batch identities", async () => {
    const mockResponse: GetBatchIdentityResponse = [
      {
        address: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
        type: "exchange",
        name: "Binance 1",
        category: "Centralized Exchange",
        tags: ["Centralized Exchange"],
      },
      {
        address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S",
        type: "exchange",
        name: "Coinbase 2",
        category: "Centralized Exchange",
        tags: ["Centralized Exchange"],
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.wallet.getBatchIdentity({
      addresses: [
        "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
        "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S",
      ],
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/wallet/batch-identity"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Invalid request",
    });

    await expect(
      rpc.wallet.getBatchIdentity({
        addresses: ["invalid"],
      })
    ).rejects.toThrow("HTTP error! status: 400");
  });

  it("Handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: 400, message: "Too many addresses" },
      }),
    });

    await expect(
      rpc.wallet.getBatchIdentity({
        addresses: Array(101).fill("test"),
      })
    ).rejects.toThrow("Helius error:");
  });
});
