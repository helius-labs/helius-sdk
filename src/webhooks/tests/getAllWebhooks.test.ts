import type { Webhook } from "../../types/webhooks";
import { createHelius } from "../../rpc/index";

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("getAllWebhooks Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches all webhooks", async () => {
     const mockWebhooks: Webhook[] = [
      {
        webhookID: "rebel-base-1138",
        wallet: "lukeskywalker.sol",
        webhookURL: "https://rebel-alliance.com/webhook1",
        transactionTypes: ["TRANSFER"],
        accountAddresses: ["alderaan-treasury.sol"],
        webhookType: "enhanced",
        authHeader: "MayTheForceBeWithYou",
      },
      {
        webhookID: "death-star-plans-66",
        wallet: "leiaorgana.sol",
        webhookURL: "https://rebel-alliance.com/webhook2",
        transactionTypes: ["NFT_SALE"],
        accountAddresses: ["endor-forest.sol"],
        webhookType: "raw",
        authHeader: "HelpMeObiWan",
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockWebhooks,
    });

    const result = await rpc.webhooks.getAll();

    expect(result).toEqual(mockWebhooks);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks?api-key=test-key`,
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("Handles empty webhook list", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const result = await rpc.webhooks.getAll();

    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks?api-key=test-key`,
      expect.objectContaining({
        method: "GET",
      })
    );
  });


  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    await expect(rpc.webhooks.getAll()).rejects.toThrow("HTTP error! status: 404 - Not found");
  });

  it("Handles Helius API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: { code: -32602, message: "Invalid params" } }),
    });

    await expect(rpc.webhooks.getAll()).rejects.toThrow("Helius error: {\"code\":-32602,\"message\":\"Invalid params\"}");
  });
});