import { authRequest } from "../utils.js";
import { SDK_USER_AGENT } from "../../http.js";

describe("authRequest headers", () => {
  const entries: [string, string][] = [
    ["Authorization", "Bearer test-token"],
    ["content-type", "text/plain"],
    ["X-Custom", "custom-value"],
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<[string, () => HeadersInit]>([
    ["Headers", () => new Headers(entries)],
    [
      "tuples",
      () => entries.map<[string, string]>(([name, value]) => [name, value]),
    ],
    ["record", () => Object.fromEntries(entries)],
  ])(
    "preserves %s values without mutating caller headers",
    async (_name, makeHeaders) => {
      const headers = makeHeaders();
      const before = Array.from(new Headers(headers).entries());
      const result = { projects: [] };
      const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => result,
      } as Response);

      await expect(
        authRequest("/projects", { method: "GET", headers }, "test-client")
      ).resolves.toEqual(result);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const sent = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(sent.get("Authorization")).toBe("Bearer test-token");
      expect(sent.get("Content-Type")).toBe("text/plain");
      expect(sent.get("X-Custom")).toBe("custom-value");
      expect(sent.get("User-Agent")).toBe(SDK_USER_AGENT);
      expect(sent.get("X-Helius-Client")).toBe("test-client");
      expect(Array.from(new Headers(headers).entries())).toEqual(before);
    }
  );

  it("preserves caller overrides of SDK headers", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await authRequest(
      "/projects",
      {
        headers: {
          "User-Agent": "caller/1.0",
          "X-Helius-Client": "caller-client",
        },
      },
      "default-client"
    );

    const sent = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(sent.get("Content-Type")).toBe("application/json");
    expect(sent.get("User-Agent")).toBe("caller/1.0");
    expect(sent.get("X-Helius-Client")).toBe("caller-client");
  });
});
