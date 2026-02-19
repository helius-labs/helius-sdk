import { createApiKey } from "../createApiKey";
import { API_URL } from "../constants";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("createApiKey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends POST to /projects/:id/add-key with wallet address", async () => {
    const mockKey = {
      keyId: "key-abc",
      keyName: "default",
      walletId: "wallet-1",
      projectId: "proj-1",
      usagePlan: "free",
      createdAt: 1700000000,
      prepaidCredits: 1000000,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockKey,
    });

    const result = await createApiKey("jwt-token", "proj-1", "wallet-addr");

    expect(result).toEqual(mockKey);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/projects/proj-1/add-key`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
        body: JSON.stringify({ userId: "wallet-addr" }),
      })
    );
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(createApiKey("jwt", "proj", "wallet")).rejects.toThrow(
      "API error (400): Bad Request"
    );
  });
});
