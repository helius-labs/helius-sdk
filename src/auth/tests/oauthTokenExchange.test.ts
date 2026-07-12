import { oauthTokenExchange } from "../oauthTokenExchange";
import { API_URL } from "../constants";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("oauthTokenExchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const args = {
    code: "auth-code",
    codeVerifier: "verifier-123",
    clientId: "cli-client",
    redirectUri: "http://127.0.0.1:0/callback",
  };

  it("POSTs to /oauth/token as application/x-www-form-urlencoded", async () => {
    const tokenResponse = {
      access_token: "jwt-token",
      token_type: "Bearer",
      expires_in: 3600,
      user: { id: "user-1", email: "dev@helius.xyz" },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => tokenResponse,
    });

    const result = await oauthTokenExchange(args);

    expect(result).toEqual(tokenResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/oauth/token`);
    expect(init.method).toBe("POST");
    // Caller's content type must win over authRequest's JSON default.
    expect(init.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    );

    const body = new URLSearchParams(init.body);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe(args.code);
    expect(body.get("code_verifier")).toBe(args.codeVerifier);
    expect(body.get("client_id")).toBe(args.clientId);
    expect(body.get("redirect_uri")).toBe(args.redirectUri);
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(oauthTokenExchange(args)).rejects.toThrow(
      "API error (400): Bad Request"
    );
  });
});
