import type { Webhook } from "../../types/webhooks";
import { createHelius } from "../../rpc/index";

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("getWebhook Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches a webhook by its ID", async () => {
    const mockWebhook: Webhook = {
      webhookID: "yavin-base-1138",
      wallet: "lukeskywalker.sol",
      webhookURL: "https://rebel-alliance.com/webhook",
      transactionTypes: ["TRANSFER"],
      accountAddresses: ["alderaan-treasury.sol"],
      webhookType: "enhanced",
      authHeader: "MayTheForceBeWithYou",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockWebhook,
    });

    const result = await rpc.webhooks.get("yavin-base-1138");

    expect(result).toEqual(mockWebhook);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/yavin-base-1138?api-key=test-key`,
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("Handles HTTP errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Webhook not found",
    });

    await expect(rpc.webhooks.get("invalid-id")).rejects.toThrow("HTTP error! status: 404 - Webhook not found");
  });

  it("Handles Helius API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: { code: -32602, message: "Invalid webhook ID" } }),
    });

    await expect(rpc.webhooks.get("invalid-id")).rejects.toThrow("Helius error: {\"code\":-32602,\"message\":\"Invalid webhook ID\"}");
  });
});