import { createHelius } from "../index";
import { createHeliusEager } from "../createHelius.eager";

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

  describe("backward compatibility", () => {
    it("works normally with apiKey provided", () => {
      const apiKey = "test-api-key";
      createHelius({ apiKey });

      const url = getUrlFromTransport();
      expect(url).toContain(`api-key=${apiKey}`);
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
});
