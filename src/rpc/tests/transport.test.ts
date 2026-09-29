import { buildRpcUrl } from "../transport";

describe("buildRpcUrl", () => {
  it("uses the network endpoint when no baseUrl is given", () => {
    expect(buildRpcUrl({ network: "devnet", apiKey: "KEY" })).toBe(
      "https://devnet.helius-rpc.com/?api-key=KEY"
    );
  });

  it("keeps the params in the query when baseUrl has a fragment", () => {
    expect(
      buildRpcUrl({
        baseUrl: "https://proxy.example.com/rpc#v1",
        apiKey: "KEY",
      })
    ).toBe("https://proxy.example.com/rpc?api-key=KEY#v1");
  });

  it("does not leave an empty param for a trailing ? or &", () => {
    expect(
      buildRpcUrl({ baseUrl: "https://proxy.example.com/rpc?", apiKey: "KEY" })
    ).toBe("https://proxy.example.com/rpc?api-key=KEY");
    expect(
      buildRpcUrl({
        baseUrl: "https://proxy.example.com/rpc?token=abc&",
        apiKey: "KEY",
      })
    ).toBe("https://proxy.example.com/rpc?token=abc&api-key=KEY");
  });

  it("replaces an api-key already in baseUrl instead of adding a second", () => {
    const url = buildRpcUrl({
      baseUrl: "https://proxy.example.com/rpc?api-key=OLD",
      apiKey: "NEW",
    });
    expect(new URL(url).searchParams.getAll("api-key")).toEqual(["NEW"]);
  });
});
