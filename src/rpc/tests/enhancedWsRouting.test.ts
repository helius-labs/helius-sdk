import { createHelius } from "../index";

// Mock the enhanced WS module so we can inspect if it gets called
const mockTransactionSubscribe = jest
  .fn()
  .mockResolvedValue({ subscriptionId: 1 });
const mockEnhancedClose = jest.fn();
const mockMakeEnhancedWsClient = jest.fn((url: string) => ({
  transactionSubscribe: mockTransactionSubscribe,
  transactionUnsubscribe: jest.fn().mockResolvedValue(true),
  accountSubscribe: jest.fn().mockResolvedValue({ subscriptionId: 2 }),
  accountUnsubscribe: jest.fn().mockResolvedValue(true),
  close: mockEnhancedClose,
  _url: url,
}));

jest.mock("../../websockets/enhancedWs", () => ({
  makeEnhancedWsClient: mockMakeEnhancedWsClient,
}));

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => jest.fn()),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({
    logsNotifications: jest.fn(),
  }),
}));

describe("Enhanced WS URL routing in createHelius", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws with apiKey-missing message when no apiKey", async () => {
    const rpc = createHelius({ baseUrl: "https://mainnet.helius-rpc.com/" });

    await expect(rpc.ws.transactionSubscribe({})).rejects.toThrow(
      "An API key is required for Enhanced WebSocket subscriptions"
    );
  });

  it("throws with custom-baseUrl message for non-Helius baseUrl", async () => {
    const rpc = createHelius({
      apiKey: "test-key",
      baseUrl: "https://custom-rpc.example.com/",
    });

    await expect(rpc.ws.transactionSubscribe({})).rejects.toThrow(
      "Enhanced WebSocket subscriptions require a standard Helius endpoint"
    );
  });

  it("works with explicit Helius devnet baseUrl and routes to atlas-devnet", async () => {
    const rpc = createHelius({
      apiKey: "test-key",
      baseUrl: "https://devnet.helius-rpc.com/",
    });

    await rpc.ws.transactionSubscribe({});

    const url = mockMakeEnhancedWsClient.mock.calls[0][0] as string;
    expect(url).toContain("atlas-devnet");
    expect(url).toContain("api-key=test-key");
  });

  it("hostname wins over network param — devnet baseUrl + mainnet network → atlas-devnet", async () => {
    const rpc = createHelius({
      apiKey: "test-key",
      baseUrl: "https://devnet.helius-rpc.com/",
      network: "mainnet",
    });

    await rpc.ws.transactionSubscribe({});

    const url = mockMakeEnhancedWsClient.mock.calls[0][0] as string;
    expect(url).toContain("atlas-devnet");
  });

  it("standard usage routes to atlas-mainnet", async () => {
    const rpc = createHelius({ apiKey: "test-key" });

    await rpc.ws.transactionSubscribe({});

    const url = mockMakeEnhancedWsClient.mock.calls[0][0] as string;
    expect(url).toBe("wss://atlas-mainnet.helius-rpc.com/?api-key=test-key");
  });
});
