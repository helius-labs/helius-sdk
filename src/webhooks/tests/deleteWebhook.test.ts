import { createHeliusEager as createHelius } from '../../rpc/createHelius.eager';

const mockFetch = jest.fn();

global.fetch = mockFetch as jest.Mock;

describe("deleteWebhook Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully deletes a webhook", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-length": "0" }),
      json: async () => ({}), // Empty response on success
    });

    const result = await rpc.webhooks.delete("yavin-base-1138");
    expect(result).toBe(true); // Updated to expect true
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.helius.xyz/v0/webhooks/yavin-base-1138?api-key=test-key`,
      expect.objectContaining({
        method: "DELETE",
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

    await expect(rpc.webhooks.delete("invalid-id")).rejects.toThrow("HTTP error! status: 404 - Webhook not found");
  });

  it("Handles Helius API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: { code: -32602, message: "Invalid webhook ID" } }),
    });

    await expect(rpc.webhooks.delete("invalid-id")).rejects.toThrow("Helius error: {\"code\":-32602,\"message\":\"Invalid webhook ID\"}");
  });
});