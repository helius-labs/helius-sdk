import { makeWsAsync } from "../wsAsync";

// Mock @solana/kit
const mockDispose = jest.fn();
const mockRpcSubscriptions = {
  logsNotifications: jest.fn().mockReturnValue("logs-sub"),
  slotNotifications: jest.fn().mockReturnValue("slot-sub"),
  signatureNotifications: jest.fn().mockReturnValue("sig-sub"),
  programNotifications: jest.fn().mockReturnValue("program-sub"),
  accountNotifications: jest.fn().mockReturnValue("account-sub"),
  dispose: mockDispose,
};

jest.mock("@solana/kit", () => ({
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue(mockRpcSubscriptions),
}));

// Mock the enhanced WS client module
const mockTransactionSubscribe = jest
  .fn()
  .mockResolvedValue({ subscriptionId: 1 });
const mockTransactionUnsubscribe = jest.fn().mockResolvedValue(true);
const mockAccountSubscribe = jest.fn().mockResolvedValue({ subscriptionId: 2 });
const mockAccountUnsubscribe = jest.fn().mockResolvedValue(true);
const mockEnhancedClose = jest.fn();

jest.mock("../enhancedWs", () => ({
  makeEnhancedWsClient: jest.fn().mockReturnValue({
    transactionSubscribe: mockTransactionSubscribe,
    transactionUnsubscribe: mockTransactionUnsubscribe,
    accountSubscribe: mockAccountSubscribe,
    accountUnsubscribe: mockAccountUnsubscribe,
    close: mockEnhancedClose,
  }),
}));

const WS_URL = "wss://mainnet.helius-rpc.com/?api-key=test";
const ENHANCED_WS_URL = "wss://atlas-mainnet.helius-rpc.com/?api-key=test";

describe("makeWsAsync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("transactionSubscribe lazy-loads enhanced client and delegates", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);
    const filter = { accountInclude: ["abc"] };
    const config = { commitment: "confirmed" as const };

    const result = await ws.transactionSubscribe(filter, config);
    expect(mockTransactionSubscribe).toHaveBeenCalledWith(filter, config);
    expect(result).toEqual({ subscriptionId: 1 });
  });

  it("transactionUnsubscribe delegates correctly", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);
    // First call to trigger lazy load
    await ws.transactionSubscribe({});
    const result = await ws.transactionUnsubscribe(1);
    expect(mockTransactionUnsubscribe).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  it("accountSubscribe delegates correctly", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);
    const result = await ws.accountSubscribe("PubKey", {
      encoding: "jsonParsed",
    });
    expect(mockAccountSubscribe).toHaveBeenCalledWith("PubKey", {
      encoding: "jsonParsed",
    });
    expect(result).toEqual({ subscriptionId: 2 });
  });

  it("accountUnsubscribe delegates correctly", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);
    await ws.accountSubscribe("PubKey");
    const result = await ws.accountUnsubscribe(2);
    expect(mockAccountUnsubscribe).toHaveBeenCalledWith(2);
    expect(result).toBe(true);
  });

  it("close() closes both standard and enhanced connections", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);

    // Trigger enhanced load
    await ws.transactionSubscribe({});
    // Trigger standard load
    await ws.logsNotifications("all");

    ws.close();
    expect(mockEnhancedClose).toHaveBeenCalled();
    expect(mockDispose).toHaveBeenCalled();
  });

  it("enhanced methods throw with apiKey-missing message when no enhancedWsUrl", async () => {
    const reason =
      "An API key is required for Enhanced WebSocket subscriptions. Provide apiKey in createHelius() options.";
    const ws = makeWsAsync(WS_URL, undefined, reason);

    await expect(ws.transactionSubscribe({})).rejects.toThrow(reason);
    await expect(ws.transactionUnsubscribe(1)).rejects.toThrow(reason);
    await expect(ws.accountSubscribe("PubKey")).rejects.toThrow(reason);
    await expect(ws.accountUnsubscribe(1)).rejects.toThrow(reason);
  });

  it("enhanced methods throw with baseUrl message when custom non-Helius baseUrl", async () => {
    const reason =
      "Enhanced WebSocket subscriptions require a standard Helius endpoint. Custom baseUrl is not supported.";
    const ws = makeWsAsync(WS_URL, undefined, reason);

    await expect(ws.transactionSubscribe({})).rejects.toThrow(reason);
  });

  it("existing standard methods still work unaffected", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);

    const logs = await ws.logsNotifications("all");
    expect(logs).toBe("logs-sub");

    const slots = await ws.slotNotifications();
    expect(slots).toBe("slot-sub");

    const sig = await ws.signatureNotifications("tx-sig");
    expect(sig).toBe("sig-sub");

    ws.close();
  });
});
