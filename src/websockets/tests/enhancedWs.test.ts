import { makeEnhancedWsClient } from "../enhancedWs";

// ── Mock WebSocket ──────────────────────────────────────────────────

type MessageHandler = (event: { data: string }) => void;

let mockInstances: MockWebSocket[] = [];

class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: MessageHandler | null = null;
  sent: string[] = [];
  closeCallCount = 0;

  constructor(public url: string) {
    mockInstances.push(this);
    // Auto-open on next microtask
    Promise.resolve().then(() => {
      if (this.onopen) this.onopen();
    });
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.closeCallCount++;
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  // Helper for tests to simulate server messages
  _receive(data: unknown) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }
}

(globalThis as any).WebSocket = MockWebSocket;

// ── Helpers ──────────────────────────────────────────────────────────

const TEST_URL = "wss://atlas-mainnet.helius-rpc.com/?api-key=test-key";

const lastWs = (): MockWebSocket => mockInstances[mockInstances.length - 1];

/** Respond to the latest JSON-RPC request sent by the client. */
const respondToLatest = (ws: MockWebSocket, result: unknown) => {
  const lastSent = JSON.parse(ws.sent[ws.sent.length - 1]);
  ws._receive({ jsonrpc: "2.0", id: lastSent.id, result });
};

// ── Tests ────────────────────────────────────────────────────────────

describe("makeEnhancedWsClient", () => {
  beforeEach(() => {
    mockInstances = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends correct JSON-RPC for transactionSubscribe", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const filter = { accountInclude: ["abc"] };
    const config = { commitment: "confirmed" as const };

    const subPromise = client.transactionSubscribe(filter, config);
    await jest.advanceTimersByTimeAsync(0); // Let WS connect
    respondToLatest(lastWs(), 42);
    const sub = await subPromise;

    const sent = JSON.parse(lastWs().sent[0]);
    expect(sent.method).toBe("transactionSubscribe");
    expect(sent.params).toEqual([filter, config]);
    expect(sub.subscriptionId).toBe(42);

    client.close();
  });

  it("delivers notifications via AsyncIterable in order", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    ws._receive({
      method: "transactionNotification",
      params: { subscription: 1, result: { signature: "s1", slot: 100 } },
    });
    ws._receive({
      method: "transactionNotification",
      params: { subscription: 1, result: { signature: "s2", slot: 101 } },
    });

    const iter = sub[Symbol.asyncIterator]();
    const n1 = await iter.next();
    const n2 = await iter.next();
    expect(n1.value.signature).toBe("s1");
    expect(n2.value.signature).toBe("s2");

    client.close();
  });

  it("transactionUnsubscribe sends JSON-RPC and completes iterator", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 5);
    const sub = await subPromise;

    const ws = lastWs();
    const unsubPromise = sub.unsubscribe();
    // Yield so sendRequest's `await connect()` resolves and the message is sent
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(ws, true);
    const result = await unsubPromise;

    expect(result).toBe(true);
    const unsubMsg = JSON.parse(ws.sent[ws.sent.length - 1]);
    expect(unsubMsg.method).toBe("transactionUnsubscribe");
    expect(unsubMsg.params).toEqual([5]);

    // Iterator should complete
    const iter = sub[Symbol.asyncIterator]();
    const next = await iter.next();
    expect(next.done).toBe(true);

    client.close();
  });

  it("accountSubscribe sends correct JSON-RPC params", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const config = {
      encoding: "jsonParsed" as const,
      commitment: "confirmed" as const,
    };
    const subPromise = client.accountSubscribe("PubKey123", config);
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 10);
    const sub = await subPromise;

    const sent = JSON.parse(lastWs().sent[0]);
    expect(sent.method).toBe("accountSubscribe");
    expect(sent.params).toEqual(["PubKey123", config]);
    expect(sub.subscriptionId).toBe(10);

    client.close();
  });

  it("accountUnsubscribe works correctly", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.accountSubscribe("PubKey123");
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 7);
    const sub = await subPromise;

    const ws = lastWs();
    const unsubPromise = client.accountUnsubscribe(7);
    // Yield so sendRequest's `await connect()` resolves and the message is sent
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(ws, true);
    expect(await unsubPromise).toBe(true);

    const iter = sub[Symbol.asyncIterator]();
    const next = await iter.next();
    expect(next.done).toBe(true);

    client.close();
  });

  it("sends keepalive ping at 30s interval", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await subPromise;

    const ws = lastWs();
    const countBefore = ws.sent.length;

    jest.advanceTimersByTime(30_000);

    // Should have sent a keepalive ping (JSON-RPC fallback with id=0)
    expect(ws.sent.length).toBe(countBefore + 1);
    const ping = JSON.parse(ws.sent[ws.sent.length - 1]);
    expect(ping.id).toBe(0);
    expect(ping.method).toBe("ping");

    client.close();
  });

  it("close() terminates all subscriptions and closes WS", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    client.close();

    expect(ws.closeCallCount).toBeGreaterThanOrEqual(1);

    // Iterator should complete
    const iter = sub[Symbol.asyncIterator]();
    const next = await iter.next();
    expect(next.done).toBe(true);
  });

  it("lazy WebSocket creation — no connection until first subscribe", () => {
    makeEnhancedWsClient(TEST_URL);
    expect(mockInstances.length).toBe(0);
  });

  it("multiple subscriptions share one WebSocket connection", async () => {
    const client = makeEnhancedWsClient(TEST_URL);

    const sub1Promise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await sub1Promise;

    const sub2Promise = client.accountSubscribe("PubKey");
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 2);
    await sub2Promise;

    expect(mockInstances.length).toBe(1);
    client.close();
  });

  it("server JSON-RPC error on subscribe rejects the promise", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);

    const ws = lastWs();
    const lastSent = JSON.parse(ws.sent[ws.sent.length - 1]);
    ws._receive({
      jsonrpc: "2.0",
      id: lastSent.id,
      error: { message: "Plan too low" },
    });

    await expect(subPromise).rejects.toThrow("Plan too low");
    client.close();
  });

  it("malformed JSON from server does not crash", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);

    const ws = lastWs();
    // Send malformed JSON
    ws.onmessage!({ data: "not json{{{" });

    respondToLatest(ws, 1);
    const sub = await subPromise;
    expect(sub.subscriptionId).toBe(1);
    client.close();
  });

  it("unknown subscription ID in notification does not crash", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await subPromise;

    // Send notification for unknown subscription
    lastWs()._receive({
      method: "transactionNotification",
      params: { subscription: 999, result: {} },
    });

    // No crash — just ignored
    client.close();
  });

  it("close() during pending connect rejects in-flight subscribe", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});

    // Close before WebSocket connects
    client.close();

    // Attach the rejection handler BEFORE flushing microtasks to avoid
    // unhandled-rejection warnings in the test runner
    const assertion = expect(subPromise).rejects.toThrow("Enhanced WebSocket");

    // Flush microtasks so MockWebSocket.onopen fires and rejects
    await jest.advanceTimersByTimeAsync(0);
    await assertion;
  });

  it("buffer overflow drops oldest notifications when at capacity", async () => {
    const client = makeEnhancedWsClient(TEST_URL);
    const subPromise = client.transactionSubscribe({});
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    // Push 10001 notifications (buffer limit is 10000)
    for (let i = 0; i < 10_001; i++) {
      ws._receive({
        method: "transactionNotification",
        params: { subscription: 1, result: { signature: `s${i}`, slot: i } },
      });
    }

    // First item should be s1 (s0 was dropped)
    const iter = sub[Symbol.asyncIterator]();
    const first = await iter.next();
    expect(first.value.signature).toBe("s1");

    client.close();
  });
});
