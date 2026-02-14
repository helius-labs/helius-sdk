import { getSDKHeaders, sanitizeClient, SDK_USER_AGENT } from "./http";

describe("sanitizeClient", () => {
  it("returns sanitized string for valid input", () => {
    expect(sanitizeClient("helius-mcp/0.3.0")).toBe("helius-mcp/0.3.0");
  });

  it("strips non-printable ASCII", () => {
    expect(sanitizeClient("my-app/1.0\r\nEvil-Header: injected")).toBe(
      "my-app/1.0Evil-Header: injected"
    );
  });

  it("returns undefined for whitespace-only input", () => {
    expect(sanitizeClient("   ")).toBeUndefined();
  });
});

describe("getSDKHeaders", () => {
  it("returns only User-Agent when no clientId is provided", () => {
    expect(getSDKHeaders()).toEqual({ "User-Agent": SDK_USER_AGENT });
  });

  it("returns only User-Agent when clientId is undefined", () => {
    expect(getSDKHeaders(undefined)).toEqual({
      "User-Agent": SDK_USER_AGENT,
    });
  });

  it("adds X-Helius-Client header when clientId is provided", () => {
    const headers = getSDKHeaders("helius-mcp/0.3.0");
    expect(headers).toEqual({
      "User-Agent": SDK_USER_AGENT,
      "X-Helius-Client": "helius-mcp/0.3.0",
    });
  });

  it("does not add X-Helius-Client for whitespace-only clientId", () => {
    expect(getSDKHeaders("   ")).toEqual({ "User-Agent": SDK_USER_AGENT });
  });

  it("sanitizes the clientId in X-Helius-Client", () => {
    const headers = getSDKHeaders("my-app/1.0\r\nEvil: injected");
    expect(headers["X-Helius-Client"]).toBe("my-app/1.0Evil: injected");
    expect(headers["User-Agent"]).toBe(SDK_USER_AGENT);
  });
});
