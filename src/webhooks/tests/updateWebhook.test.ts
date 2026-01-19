import type { UpdateWebhookRequest, Webhook } from "../../types/webhooks";
import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("updateWebhook Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully updates a webhook", async () => {
    const mockParams: UpdateWebhookRequest = {
      webhookURL: "https://rebel-alliance.com/updated-webhook",
      transactionTypes: ["NFT_SALE"],
      accountAddresses: ["endor-forest.sol"],
    };

    const mockResponse: Webhook = {
      webhookID: "yavin-base-1138",
      wallet: "lukeskywalker.sol",
      webhookURL: "https://rebel-alliance.com/updated-webhook",
      transactionTypes: ["NFT_SALE"],
      accountAddresses: ["endor-forest.sol"],
      webhookType: "enhanced",
      authHeader: "MayTheForceBeWithYou",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.webhooks.update("yavin-base-1138", mockParams);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/yavin-base-1138?api-key=test-key`,
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(mockParams),
      })
    );
  });

  it("Successfully updates webhook with partial params", async () => {
    const mockParams: UpdateWebhookRequest = {
      transactionTypes: ["NFT_MINT"],
    };

    const mockResponse: Webhook = {
      webhookID: "death-star-plans-66",
      wallet: "leiaorgana.sol",
      webhookURL: "https://rebel-alliance.com/webhook",
      transactionTypes: ["NFT_MINT"],
      accountAddresses: ["alderaan-treasury.sol"],
      webhookType: "raw",
      authHeader: "HelpMeObiWan",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.webhooks.update("death-star-plans-66", mockParams);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/death-star-plans-66?api-key=test-key`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockParams),
      })
    );
  });

  it("Handles HTTP errors", async () => {
    const mockParams: UpdateWebhookRequest = {
      webhookURL: "https://invalid-url.com",
    };

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Webhook not found",
    });

    await expect(rpc.webhooks.update("invalid-id", mockParams)).rejects.toThrow(
      "HTTP error! status: 404 - Webhook not found"
    );
  });

  it("Handles Helius API errors", async () => {
    const mockParams: UpdateWebhookRequest = {
      webhookURL: "https://rebel-alliance.com/webhook",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: -32602, message: "Invalid params" },
      }),
    });

    await expect(rpc.webhooks.update("invalid-id", mockParams)).rejects.toThrow(
      'Helius error: {"code":-32602,"message":"Invalid params"}'
    );
  });
});
