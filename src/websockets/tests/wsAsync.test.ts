import type { Address } from "@solana/kit";
import { makeWsAsync } from "../wsAsync.js";

// Mock @solana/kit. Like Kit's, each method returns a pending request whose
// subscribe()/reactive() take the abortSignal that ends the subscription.
const mockSubscribe = jest.fn(async (_config: { abortSignal: AbortSignal }) =>
  (async function* () {})()
);
const mockReactive = jest.fn(async (_config: { abortSignal: AbortSignal }) => ({
  getUnifiedState: jest.fn(),
  subscribe: jest.fn(),
}));
const pendingRequest = (name: string) => ({
  name,
  subscribe: mockSubscribe,
  reactive: mockReactive,
});
const mockRpcSubscriptions = {
  logsNotifications: jest.fn().mockReturnValue(pendingRequest("logs-sub")),
  slotNotifications: jest.fn().mockReturnValue(pendingRequest("slot-sub")),
  signatureNotifications: jest.fn().mockReturnValue(pendingRequest("sig-sub")),
  programNotifications: jest
    .fn()
    .mockReturnValue(pendingRequest("program-sub")),
  accountNotifications: jest
    .fn()
    .mockReturnValue(pendingRequest("account-sub")),
};
const mockCreateSolanaRpcSubscriptions = jest
  .fn()
  .mockReturnValue(mockRpcSubscriptions);

jest.mock("@solana/kit", () => ({
  createSolanaRpcSubscriptions: mockCreateSolanaRpcSubscriptions,
}));

// Mock the enhanced WS client module
const mockTransactionSubscribe = jest
  .fn()
  .mockResolvedValue({ subscriptionId: 1 });
const mockTransactionUnsubscribe = jest.fn().mockResolvedValue(true);
const mockAccountSubscribe = jest.fn().mockResolvedValue({ subscriptionId: 2 });
const mockAccountUnsubscribe = jest.fn().mockResolvedValue(true);
const mockEnhancedClose = jest.fn();

jest.mock("../enhancedWs.js", () => ({
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
    // Open a standard subscription the caller never aborts
    const logs = await ws.logsNotifications("all");
    await logs.subscribe({ abortSignal: new AbortController().signal });
    const kitSignal = mockSubscribe.mock.calls[0][0].abortSignal;
    expect(kitSignal.aborted).toBe(false);

    ws.close();
    expect(mockEnhancedClose).toHaveBeenCalled();
    // Kit closes a socket once every subscription on it is aborted
    expect(kitSignal.aborted).toBe(true);
  });

  it("close() ends every standard subscription, including reactive ones", async () => {
    const ws = makeWsAsync(WS_URL);

    const slots = await ws.slotNotifications();
    await slots.subscribe({ abortSignal: new AbortController().signal });
    const account = await ws.accountNotifications("acctId" as Address);
    await account.reactive({ abortSignal: new AbortController().signal });

    const signals = [
      mockSubscribe.mock.calls[0][0].abortSignal,
      mockReactive.mock.calls[0][0].abortSignal,
    ];
    expect(signals.map((s) => s.aborted)).toEqual([false, false]);

    ws.close();
    expect(signals.map((s) => s.aborted)).toEqual([true, true]);
  });

  it("subscribing after close() rejects instead of opening a connection", async () => {
    const ws = makeWsAsync(WS_URL);
    const logs = await ws.logsNotifications("all");

    ws.close();

    await expect(
      logs.subscribe({ abortSignal: new AbortController().signal })
    ).rejects.toThrow("WebSocket client is closed");
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("aborting a caller's own signal ends only that subscription", async () => {
    const ws = makeWsAsync(WS_URL);
    const first = new AbortController();

    const logs = await ws.logsNotifications("all");
    await logs.subscribe({ abortSignal: first.signal });
    await logs.subscribe({ abortSignal: new AbortController().signal });
    const [a, b] = mockSubscribe.mock.calls.map((c) => c[0].abortSignal);

    first.abort("done");
    expect(a.aborted).toBe(true);
    expect(a.reason).toBe("done");
    expect(b.aborted).toBe(false);

    ws.close();
    expect(b.aborted).toBe(true);
  });

  it("rejects standard subscriptions after close() instead of reopening a connection", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);

    await ws.logsNotifications("all");
    expect(mockCreateSolanaRpcSubscriptions).toHaveBeenCalledTimes(1);

    ws.close();

    await expect(ws.logsNotifications("all")).rejects.toThrow(
      "WebSocket client is closed"
    );
    await expect(ws.slotNotifications()).rejects.toThrow(
      "WebSocket client is closed"
    );
    await expect(ws.signatureNotifications("tx-sig")).rejects.toThrow(
      "WebSocket client is closed"
    );
    await expect(ws.programNotifications("progId" as Address)).rejects.toThrow(
      "WebSocket client is closed"
    );
    await expect(ws.accountNotifications("acctId" as Address)).rejects.toThrow(
      "WebSocket client is closed"
    );

    // No new underlying connection should have been opened post-close.
    expect(mockCreateSolanaRpcSubscriptions).toHaveBeenCalledTimes(1);
  });

  it("rejects when close() lands while the first client is still loading", async () => {
    const ws = makeWsAsync(WS_URL, ENHANCED_WS_URL);

    // Don't await yet — close() races the in-flight dynamic import in raw().
    const pending = ws.logsNotifications("all");
    ws.close();

    await expect(pending).rejects.toThrow("WebSocket client is closed");

    // No client was built, so nothing can subscribe (and connect) later
    expect(mockCreateSolanaRpcSubscriptions).not.toHaveBeenCalled();
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
    expect(logs).toMatchObject({ name: "logs-sub" });

    const slots = await ws.slotNotifications();
    expect(slots).toMatchObject({ name: "slot-sub" });
    // No argument at all: an undefined one goes out as `params: [null]`,
    // which the server rejects.
    expect(mockRpcSubscriptions.slotNotifications).toHaveBeenCalledWith();

    const sig = await ws.signatureNotifications("tx-sig");
    expect(sig).toMatchObject({ name: "sig-sub" });

    ws.close();
  });
});
