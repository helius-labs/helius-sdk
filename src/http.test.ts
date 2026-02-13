import { getUserAgent, SDK_USER_AGENT } from "./http";

describe("getUserAgent", () => {
  it("returns SDK user agent when no prefix is provided", () => {
    expect(getUserAgent()).toBe(SDK_USER_AGENT);
  });

  it("returns SDK user agent when prefix is undefined", () => {
    expect(getUserAgent(undefined)).toBe(SDK_USER_AGENT);
  });

  it("prepends prefix to SDK user agent", () => {
    const result = getUserAgent("helius-mcp/0.3.0");
    expect(result).toBe(`helius-mcp/0.3.0 ${SDK_USER_AGENT}`);
  });
});
