import { createHelius, HeliusRpcError } from "../index";
import {
  createHeliusEager,
  HeliusRpcError as EagerHeliusRpcError,
} from "../createHelius.eager";
import { makeWsAsync } from "../../websockets/wsAsync";

const transportMock = jest.fn();
const createDefaultRpcTransportMock = jest.fn((_opts?: any) => transportMock);

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  // Avoid rest/spread typing issues under rollup-plugin-typescript
  // Also avoid declaring parameters (some typings treat this as 0-arg)
  createDefaultRpcTransport: jest.fn(function () {
    return createDefaultRpcTransportMock((arguments as any)[0]);
  }),
  createRpc: jest.fn().mockReturnValue({}),
}));

jest.mock("../../websockets/wsAsync", () => ({
  makeWsAsync: jest.fn(() => ({ close: jest.fn() })),
}));

const getUrlFromTransport = (): string => {
  const calls = createDefaultRpcTransportMock.mock.calls as any[];
  const last = calls.length ? (calls[calls.length - 1] as any) : undefined;
  const opts = last?.[0] as any;
  return opts?.url ?? "";
};

describe("createHelius", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    createDefaultRpcTransportMock.mockClear();
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: { id: "test-asset" },
    });
  });

  describe("URL construction", () => {
    it("constructs default Helius URL with apiKey", () => {
      const apiKey = "test-api-key";
      createHelius({ apiKey });

      const url = getUrlFromTransport();
      expect(url).toContain("https://mainnet.helius-rpc.com/");
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("constructs URL with custom baseUrl and no apiKey", () => {
      const customBaseUrl = "https://custom-rpc.example.com/";
      createHelius({ baseUrl: customBaseUrl });

      const url = getUrlFromTransport();
      expect(url).toContain(customBaseUrl);
      expect(url).not.toContain("api-key");
    });

    it("constructs URL with custom baseUrl and apiKey", () => {
      const customBaseUrl = "https://custom-rpc.example.com/";
      const apiKey = "test-api-key";
      createHelius({ baseUrl: customBaseUrl, apiKey });

      const url = getUrlFromTransport();
      expect(url).toContain(customBaseUrl);
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("supports devnet network", () => {
      const apiKey = "test-api-key";
      createHelius({ apiKey, network: "devnet" });

      const url = getUrlFromTransport();
      expect(url).toContain("https://devnet.helius-rpc.com/");
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("supports rebateAddress parameter", () => {
      const apiKey = "test-api-key";
      const rebateAddress = "rebate-address-123";
      createHelius({ apiKey, rebateAddress });

      const url = getUrlFromTransport();
      expect(url).toContain(`api-key=${apiKey}`);
      expect(url).toContain(`rebate-address=${rebateAddress}`);
    });

    it("adds mev-protect to the RPC URL but not the WebSocket URL", () => {
      const helius = createHelius({ apiKey: "test-api-key", mevProtect: true });

      expect(
        new URL(getUrlFromTransport()).searchParams.get("mev-protect")
      ).toBe("true");

      void helius.ws;
      const wsUrl = new URL(jest.mocked(makeWsAsync).mock.calls[0][0]);
      expect(wsUrl.searchParams.has("mev-protect")).toBe(false);
      expect(wsUrl.searchParams.get("api-key")).toBe("test-api-key");
    });

    it("leaves a custom baseUrl query untouched on the WebSocket URL", () => {
      const helius = createHelius({
        baseUrl: "https://proxy.example.com/rpc?sig=a%20b&flag",
      });

      void helius.ws;
      expect(jest.mocked(makeWsAsync).mock.calls[0][0]).toBe(
        "wss://proxy.example.com/rpc?sig=a%20b&flag"
      );
    });

    it("adds mev-protect to the eager client's RPC URL", () => {
      createHeliusEager({ apiKey: "test-api-key", mevProtect: true });
      expect(
        new URL(getUrlFromTransport()).searchParams.get("mev-protect")
      ).toBe("true");
    });

    it("appends to a custom baseUrl that already has a query", () => {
      const apiKey = "test-api-key";
      const rebateAddress = "rebate-address-123";
      const helius = createHelius({
        baseUrl: "https://proxy.example.com/rpc?token=abc",
        apiKey,
        rebateAddress,
      });

      const params = new URL(getUrlFromTransport()).searchParams;
      expect(params.get("token")).toBe("abc");
      expect(params.get("api-key")).toBe(apiKey);
      expect(params.get("rebate-address")).toBe(rebateAddress);

      void helius.ws;
      const wsUrl = new URL(jest.mocked(makeWsAsync).mock.calls[0][0]);
      expect(wsUrl.protocol).toBe("wss:");
      expect(wsUrl.searchParams.get("token")).toBe("abc");
      expect(wsUrl.searchParams.get("api-key")).toBe(apiKey);
      expect(wsUrl.searchParams.get("rebate-address")).toBe(rebateAddress);
    });
  });

  describe("webhooks without apiKey", () => {
    it("throws error when accessing webhooks without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      await expect(rpc.webhooks.getAll()).rejects.toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });

    it("throws error when accessing webhooks.create without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      await expect(
        rpc.webhooks.create({
          webhookURL: "https://example.com/webhook",
          transactionTypes: ["TRANSFER"],
          accountAddresses: ["test.sol"],
          webhookType: "enhanced",
        })
      ).rejects.toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("enhanced without apiKey", () => {
    it("throws error when accessing enhanced without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      await expect(
        rpc.enhanced.getTransactions({ transactions: [] })
      ).rejects.toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });

    it("throws error when accessing enhanced.getTransactionsByAddress without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      await expect(
        rpc.enhanced.getTransactionsByAddress({
          address: "test-address",
        })
      ).rejects.toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("admin without apiKey", () => {
    it("throws error when accessing admin methods without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      await expect(rpc.admin.getProjectUsage("proj-123")).rejects.toThrow(
        "An API key is required to use the Admin API. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("lazy namespaces", () => {
    it("does not crash on a bare read of a keyed namespace without apiKey", async () => {
      const rpc = createHelius({ baseUrl: "https://custom-rpc.example.com/" });

      void rpc.wallet;
      void rpc.admin;
      void rpc.webhooks;
      // Jest fails the test if the failed loads leave an unhandled rejection
      await new Promise((resolve) => setImmediate(resolve));

      await expect(
        rpc.wallet.getBalances({ wallet: "wallet" })
      ).rejects.toThrow("An API key is required to use the Wallet API");
    });

    it("routes helius.close() through the ws namespace, so a spy sees it", async () => {
      const rpc = createHelius({ apiKey: "test-api-key" });
      await rpc.ws.close(); // loads the ws namespace, which defines helius.close

      const spy = jest.spyOn(rpc.ws, "close");
      spy.mockClear();
      Reflect.get(rpc, "close")();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("resolves `await helius.<namespace>` to the loaded namespace", async () => {
      const rpc = createHelius({ apiKey: "test-api-key" });

      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("{}"));
      try {
        const admin = await rpc.admin;
        // A call that completes guarantees the namespace has loaded
        await admin.getProjectUsage("project").catch(() => {});

        expect(admin).toBe(rpc.admin);
        expect("getProjectUsage" in admin).toBe(true);
        expect(Reflect.get(admin, "doesNotExist")).toBeUndefined();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe("backward compatibility", () => {
    it("works normally with apiKey provided", () => {
      const apiKey = "test-api-key";
      createHelius({ apiKey });

      const url = getUrlFromTransport();
      expect(url).toContain(`api-key=${apiKey}`);
    });
  });

  describe("transport hook", () => {
    it("invokes the hook once with the default transport and uses its result", async () => {
      const hook = jest.fn((defaultTransport: any) => defaultTransport);
      const rpc = createHelius({ apiKey: "test-api-key", transport: hook });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(typeof hook.mock.calls[0][0]).toBe("function");

      const asset = await rpc.getAsset({ id: "test-id" });
      expect(asset).toEqual({ id: "test-asset" });
      expect(transportMock).toHaveBeenCalledTimes(1);
    });

    it("routes DAS calls through the wrapping transport", async () => {
      const wrapperCalls: string[] = [];
      const rpc = createHelius({
        apiKey: "test-api-key",
        transport: (defaultTransport) => async (request) => {
          wrapperCalls.push((request.payload as any).method);
          return defaultTransport(request);
        },
      });

      await rpc.getAsset({ id: "test-id" });
      expect(wrapperCalls).toEqual(["getAsset"]);
    });

    it("supports retry policies around the default transport", async () => {
      transportMock
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({
          jsonrpc: "2.0",
          id: "1",
          result: { id: "retried-asset" },
        });

      const rpc = createHelius({
        apiKey: "test-api-key",
        transport: (defaultTransport) => async (request) => {
          try {
            return await defaultTransport(request);
          } catch {
            return defaultTransport(request);
          }
        },
      });

      const asset = await rpc.getAsset({ id: "test-id" });
      expect(asset).toEqual({ id: "retried-asset" });
      expect(transportMock).toHaveBeenCalledTimes(2);
    });

    it("supports full transport replacement", async () => {
      const customTransport = jest.fn().mockResolvedValue({
        jsonrpc: "2.0",
        id: "1",
        result: { id: "custom-asset" },
      });
      const rpc = createHelius({
        apiKey: "test-api-key",
        transport: () => customTransport,
      });

      const asset = await rpc.getAsset({ id: "test-id" });
      expect(asset).toEqual({ id: "custom-asset" });
      expect(customTransport).toHaveBeenCalledTimes(1);
      expect(transportMock).not.toHaveBeenCalled();
    });

    it("stamps the SDK request id before the wrapped transport", async () => {
      const rpc = createHelius({
        apiKey: "test-api-key",
        transport: (defaultTransport) => defaultTransport,
      });

      await rpc.getAsset({ id: "test-id" });

      const request = transportMock.mock.calls[0][0] as any;
      expect(request.payload.id).toBe("helius-sdk");
      expect(request.payload.method).toBe("getAsset");
    });

    it("throws at construction when the hook does not return a transport", () => {
      expect(() =>
        createHelius({
          apiKey: "test-api-key",
          transport: (() => undefined) as any,
        })
      ).toThrow(
        "The transport option must be a function that receives the default transport and returns an RpcTransport."
      );
    });
  });
});

describe("createHeliusEager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    createDefaultRpcTransportMock.mockClear();
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: { id: "test-asset" },
    });
  });

  describe("URL construction", () => {
    it("constructs default Helius URL with apiKey", async () => {
      const apiKey = "test-api-key";
      const rpc = createHeliusEager({ apiKey });

      await rpc.getAsset({ id: "test-id" });

      const url = getUrlFromTransport();
      expect(url).toContain("https://mainnet.helius-rpc.com/");
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("constructs URL with custom baseUrl and apiKey", async () => {
      const customBaseUrl = "https://custom-rpc.example.com/";
      const apiKey = "test-api-key";
      const rpc = createHeliusEager({ baseUrl: customBaseUrl, apiKey });

      await rpc.getAsset({ id: "test-id" });

      const url = getUrlFromTransport();
      expect(url).toContain(customBaseUrl);
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("allows empty options (custom RPC use case)", async () => {
      const customBaseUrl = "https://custom-rpc.example.com/";
      const rpc = createHeliusEager({ baseUrl: customBaseUrl });

      await rpc.getAsset({ id: "test-id" });

      const url = getUrlFromTransport();
      expect(url).toContain(customBaseUrl);
      expect(url).not.toContain("api-key");
    });

    it("appends to a custom baseUrl that already has a query", async () => {
      const apiKey = "test-api-key";
      const rebateAddress = "rebate-address-123";
      const rpc = createHeliusEager({
        baseUrl: "https://proxy.example.com/rpc?token=abc",
        apiKey,
        rebateAddress,
      });

      await rpc.getAsset({ id: "test-id" });

      const params = new URL(getUrlFromTransport()).searchParams;
      expect(params.get("token")).toBe("abc");
      expect(params.get("api-key")).toBe(apiKey);
      expect(params.get("rebate-address")).toBe(rebateAddress);
    });
  });

  describe("webhooks without apiKey", () => {
    it("throws error when accessing webhooks methods without apiKey", () => {
      const rpc = createHeliusEager({
        baseUrl: "https://custom-rpc.example.com/",
      });

      expect(() => rpc.webhooks.getAll()).toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });

    it("throws error when accessing webhooks.create without apiKey", () => {
      const rpc = createHeliusEager({
        baseUrl: "https://custom-rpc.example.com/",
      });

      expect(() =>
        rpc.webhooks.create({
          webhookURL: "https://example.com/webhook",
          transactionTypes: ["TRANSFER"],
          accountAddresses: ["test.sol"],
          webhookType: "enhanced",
        })
      ).toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("enhanced without apiKey", () => {
    it("throws error when accessing enhanced methods without apiKey", () => {
      const rpc = createHeliusEager({
        baseUrl: "https://custom-rpc.example.com/",
      });

      expect(() => rpc.enhanced.getTransactions({ transactions: [] })).toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });

    it("throws error when accessing enhanced.getTransactionsByAddress without apiKey", () => {
      const rpc = createHeliusEager({
        baseUrl: "https://custom-rpc.example.com/",
      });

      expect(() =>
        rpc.enhanced.getTransactionsByAddress({
          address: "test-address",
        })
      ).toThrow(
        "An API key is required to use webhooks/enhanced transactions. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("admin without apiKey", () => {
    it("throws error when accessing admin methods without apiKey", () => {
      const rpc = createHeliusEager({
        baseUrl: "https://custom-rpc.example.com/",
      });

      expect(() => rpc.admin.getProjectUsage("proj-123")).toThrow(
        "An API key is required to use the Admin API. Provide apiKey in createHelius() options."
      );
    });
  });

  describe("backward compatibility", () => {
    it("works normally with apiKey provided", async () => {
      const apiKey = "test-api-key";
      const rpc = createHeliusEager({ apiKey });

      await rpc.getAsset({ id: "test-id" });

      const url = getUrlFromTransport();
      expect(url).toContain(`api-key=${apiKey}`);
    });

    it("webhooks works with apiKey provided", () => {
      const apiKey = "test-api-key";
      const rpc = createHeliusEager({ apiKey });

      // Should not throw
      expect(() => rpc.webhooks).not.toThrow();
      expect(rpc.webhooks).toBeDefined();
    });

    it("enhanced works with apiKey provided", () => {
      const apiKey = "test-api-key";
      const rpc = createHeliusEager({ apiKey });

      // Should not throw
      expect(() => rpc.enhanced).not.toThrow();
      expect(rpc.enhanced).toBeDefined();
    });
  });

  describe("transport hook", () => {
    it("invokes the hook once and routes DAS calls through its transport", async () => {
      const wrapperCalls: string[] = [];
      const hook = jest.fn((defaultTransport: any) => async (request: any) => {
        wrapperCalls.push(request.payload.method);
        return defaultTransport(request);
      });
      const rpc = createHeliusEager({
        apiKey: "test-api-key",
        transport: hook,
      });

      expect(hook).toHaveBeenCalledTimes(1);

      const asset = await rpc.getAsset({ id: "test-id" });
      expect(asset).toEqual({ id: "test-asset" });
      expect(wrapperCalls).toEqual(["getAsset"]);
    });

    it("supports retry policies around the default transport", async () => {
      transportMock
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({
          jsonrpc: "2.0",
          id: "1",
          result: { id: "retried-asset" },
        });

      const rpc = createHeliusEager({
        apiKey: "test-api-key",
        transport: (defaultTransport) => async (request) => {
          try {
            return await defaultTransport(request);
          } catch {
            return defaultTransport(request);
          }
        },
      });

      const asset = await rpc.getAsset({ id: "test-id" });
      expect(asset).toEqual({ id: "retried-asset" });
      expect(transportMock).toHaveBeenCalledTimes(2);
    });

    it("stamps the SDK request id on outgoing payloads", async () => {
      const rpc = createHeliusEager({ apiKey: "test-api-key" });

      await rpc.getAsset({ id: "test-id" });

      const request = transportMock.mock.calls[0][0] as any;
      expect(request.payload.id).toBe("helius-sdk");
      expect(request.payload.method).toBe("getAsset");
    });
  });

  describe("HeliusRpcError", () => {
    const rpcErrorResponse = {
      jsonrpc: "2.0",
      id: "helius-sdk",
      error: { code: -32602, message: "Invalid params" },
    };

    it("is exported from the main entry and thrown by client methods", async () => {
      transportMock.mockResolvedValue(rpcErrorResponse);
      const rpc = createHelius({ apiKey: "test-api-key" });

      const err = await rpc.getAsset({ id: "bad" }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(HeliusRpcError);
      expect(err).toMatchObject({ method: "getAsset", code: -32602 });
    });

    it("is exported from the eager entry and thrown by client methods", async () => {
      transportMock.mockResolvedValue(rpcErrorResponse);
      const rpc = createHeliusEager({ apiKey: "test-api-key" });

      const err = await rpc.getAsset({ id: "bad" }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(EagerHeliusRpcError);
      expect(EagerHeliusRpcError).toBe(HeliusRpcError);
    });
  });
});
