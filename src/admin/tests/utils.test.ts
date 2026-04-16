import { adminRequest } from "../utils";

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
});
