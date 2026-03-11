import type { Webhook } from "../../types/webhooks";
import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("toggleWebhook Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully enables a webhook", async () => {
    const mockResponse: Webhook = {
      webhookID: "yavin-base-1138",
      wallet: "lukeskywalker.sol",
      webhookURL: "https://rebel-alliance.com/webhook",
      transactionTypes: ["NFT_SALE"],
      accountAddresses: ["endor-forest.sol"],
      webhookType: "enhanced",
      authHeader: "MayTheForceBeWithYou",
      active: true,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.webhooks.toggle("yavin-base-1138", true);

    expect(result).toEqual(mockResponse);
    expect(result.active).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/yavin-base-1138?api-key=test-key`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ active: true }),
      })
    );
  });

  it("Successfully disables a webhook", async () => {
    const mockResponse: Webhook = {
      webhookID: "death-star-plans-66",
      wallet: "leiaorgana.sol",
      webhookURL: "https://rebel-alliance.com/webhook",
      transactionTypes: ["TRANSFER"],
      accountAddresses: ["alderaan-treasury.sol"],
      webhookType: "raw",
      authHeader: "HelpMeObiWan",
      active: false,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.webhooks.toggle("death-star-plans-66", false);

    expect(result).toEqual(mockResponse);
    expect(result.active).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/death-star-plans-66?api-key=test-key`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      })
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Webhook not found",
    });

    await expect(rpc.webhooks.toggle("invalid-id", true)).rejects.toThrow(
      "HTTP error! status: 404 - Webhook not found"
    );
  });

  it("Handles Helius API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: -32602, message: "Invalid params" },
      }),
    });

    await expect(rpc.webhooks.toggle("invalid-id", true)).rejects.toThrow(
      'Helius error: {"code":-32602,"message":"Invalid params"}'
    );
  });
});
