import { adminRequest } from "../utils.js";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("adminRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when options.headers X-Api-Key conflicts with apiKey argument", async () => {
    await expect(
      adminRequest("real-key", "/test", {
        headers: { "X-Api-Key": "different-key" },
      })
    ).rejects.toThrow(
      "X-Api-Key header in options.headers conflicts with the apiKey argument"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("allows options.headers X-Api-Key when it matches apiKey argument", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: "ok" }),
    });

    const result = await adminRequest("real-key", "/test", {
      headers: { "X-Api-Key": "real-key" },
    });

    expect(result).toEqual({ result: "ok" });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("allows requests with no X-Api-Key in options.headers", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: "ok" }),
    });

    const result = await adminRequest("real-key", "/test");

    expect(result).toEqual({ result: "ok" });
    expect(mockFetch).toHaveBeenCalled();
  });

  it.each(["record", "Headers", "tuples"] as const)(
    "forwards %s headers and overrides defaults without mutating the caller",
    async (shape) => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: "ok" }),
      });
      const entries: [string, string][] = [
        ["X-Request-Id", "request-123"],
        ["content-type", "application/problem+json"],
      ];
      const headers =
        shape === "Headers"
          ? new Headers(entries)
          : shape === "tuples"
            ? entries
            : Object.fromEntries(entries);
      const original = [...new Headers(headers)];

      await adminRequest("test-key", "/test", { method: "GET", headers });

      const sent = new Headers(mockFetch.mock.calls[0][1].headers);
      expect(sent.get("X-Request-Id")).toBe("request-123");
      expect(sent.get("Content-Type")).toBe("application/problem+json");
      expect(sent.get("X-Api-Key")).toBe("test-key");
      expect(sent.get("User-Agent")).toMatch(/^helius-node-sdk\//);
      expect([...new Headers(headers)]).toEqual(original);
    }
  );
});
