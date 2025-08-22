import type { CreateWebhookRequest, Webhook } from "../../types/webhooks";
import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("createWebhook Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully creates a webhook", async () => {
    const mockParams: CreateWebhookRequest = {
      webhookURL: "https://hogwarts.edu/owlery",
      transactionTypes: ["SPELL_CAST"],
      accountAddresses: ["albusdumbledore.sol"],
      webhookType: "enhanced",
      authHeader: "Expecto-Patronum",
      encoding: "base64",
      txnStatus: "all",
    };

    const mockResponse: Webhook = {
      webhookID: "hogwarts-express-1138",
      wallet: "albusdumbledore.sol",
      webhookURL: "https://hogwarts.edu/owlery",
      transactionTypes: ["SPELL_CAST"],
      accountAddresses: ["albusdumbledore.sol"],
      webhookType: "enhanced",
      authHeader: "Expecto-Patronum",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.webhooks.create(mockParams);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks?api-key=test-key`,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockParams),
      })
    );
  });

  it("Handles HTTP errors", async () => {
    const mockParams: CreateWebhookRequest = {
      webhookURL: "https://invalid-url.com",
      transactionTypes: ["SPELL_CAST"],
      accountAddresses: ["albusdumbledore.sol"],
      webhookType: "enhanced",
    };

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(rpc.webhooks.create(mockParams)).rejects.toThrow(
      "HTTP error! status: 400 - Bad Request"
    );
  });

  it("Handles Helius API errors", async () => {
    const mockParams: CreateWebhookRequest = {
      webhookURL: "https://hogwarts.edu/owlery",
      transactionTypes: ["SPELL_CAST"],
      accountAddresses: ["albusdumbledore.sol"],
      webhookType: "enhanced",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: -32602, message: "Invalid params" },
      }),
    });

    await expect(rpc.webhooks.create(mockParams)).rejects.toThrow(
      'Helius error: {"code":-32602,"message":"Invalid params"}'
    );
  });
});
