import { walletSignup } from "../walletSignup";
import { API_URL } from "../constants";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("walletSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends POST to /wallet-signup with correct body", async () => {
    const mockResponse = { token: "jwt-123", refId: "ref-1", newUser: true };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await walletSignup("msg", "sig", "addr123");

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/wallet-signup`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "msg",
          signature: "sig",
          userID: "addr123",
        }),
      })
    );
  });

  it("includes SDK headers and userAgent", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "t", refId: "r", newUser: false }),
    });

    await walletSignup("msg", "sig", "addr", "my-agent/1.0");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["User-Agent"]).toMatch(/^helius-node-sdk\//);
    expect(init.headers["X-Helius-Client"]).toBe("my-agent/1.0");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(walletSignup("msg", "sig", "addr")).rejects.toThrow(
      "API error (401): Unauthorized"
    );
  });
});
