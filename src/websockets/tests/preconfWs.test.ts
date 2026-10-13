import {
  decodePreconfFrame,
  makePreconfWsClient,
  makePreconfWsClientForApiKey,
  PRECONF_WEBSOCKET_URL,
  PreconfStatus,
} from "../preconfWs";
import { createTxMessage } from "../../transactions/createTxMessage";
import {
  generateKeyPairSigner,
  getTransactionEncoder,
  signTransactionMessageWithSigners,
  type Blockhash,
} from "@solana/kit";

// ── Build a real wire-format transaction payload ──
// `@solana/kit`'s transaction codec is byte-compatible with a Solana
// bincode-serialized signed transaction: shortvec(signatures) + message.
const buildTxBytes = (): Uint8Array => {
  // 1 signature, header(1 req sig, 0 ro-signed, 1 ro-unsigned), 2 account keys,
  // 32-byte blockhash, 0 instructions.
  return new Uint8Array([
    0x01,
    ...new Array(64).fill(0),
    0x01,
    0x00,
    0x01,
    0x02,
    ...new Array(32).fill(7),
    ...new Array(32).fill(9),
    ...new Array(32).fill(0),
    0x00,
  ]);
};

const buildFrame = (
  slot: bigint,
  idx: bigint,
  txBytes: Uint8Array,
  status = 1,
  version = 1
): Uint8Array => {
  const buf = new Uint8Array(18 + txBytes.length);
  const view = new DataView(buf.buffer);
  view.setUint8(0, version);
  view.setBigUint64(1, slot, true);
  view.setBigUint64(9, idx, true);
  view.setUint8(17, status);
  buf.set(txBytes, 18);
  return buf;
};

// ── decodePreconfFrame unit tests ────────────────────────────────────

describe("decodePreconfFrame", () => {
  it("decodes version, slot, transactionIndex, status, and transaction", () => {
    const txBytes = buildTxBytes();
    const frame = buildFrame(123n, 7n, txBytes, PreconfStatus.Success);

    const notif = decodePreconfFrame(frame);

    expect(notif.version).toBe(1);
    expect(notif.slot).toBe(123n);
    expect(notif.transactionIndex).toBe(7n);
    expect(notif.status).toBe(PreconfStatus.Success);
    expect(notif.transactionBytes).toEqual(txBytes);
    // Decoded into the kit Transaction shape.
    expect(Object.keys(notif.transaction)).toEqual(
      expect.arrayContaining(["messageBytes", "signatures"])
    );
  });

  it("decodes each status variant (out-of-range falls back to Unknown)", () => {
    const tx = buildTxBytes();
    expect(decodePreconfFrame(buildFrame(1n, 0n, tx, 0)).status).toBe(
      PreconfStatus.Failed
    );
    expect(decodePreconfFrame(buildFrame(1n, 0n, tx, 1)).status).toBe(
      PreconfStatus.Success
    );
    expect(decodePreconfFrame(buildFrame(1n, 0n, tx, 2)).status).toBe(
      PreconfStatus.Unknown
    );
    expect(decodePreconfFrame(buildFrame(1n, 0n, tx, 9)).status).toBe(
      PreconfStatus.Unknown
    );
  });

  it("throws on an unknown wire version", () => {
    const frame = buildFrame(1n, 0n, buildTxBytes(), 1, 2);
    expect(() => decodePreconfFrame(frame)).toThrow(
      /unsupported preconf wire version/i
    );
  });

  it("handles large slot and index (u64)", () => {
    const frame = buildFrame(
      18446744073709551615n, // u64::MAX
      18446744073709551614n,
      buildTxBytes()
    );
    const notif = decodePreconfFrame(frame);
    expect(notif.slot).toBe(18446744073709551615n);
    expect(notif.transactionIndex).toBe(18446744073709551614n);
  });

  it("throws on a frame shorter than the header", () => {
    expect(() => decodePreconfFrame(new Uint8Array(18))).toThrow(/too short/i);
    expect(() => decodePreconfFrame(new Uint8Array(0))).toThrow(/too short/i);
  });

  it("throws on an undecodable transaction payload", () => {
    const frame = buildFrame(1n, 0n, new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    expect(() => decodePreconfFrame(frame)).toThrow();
  });

  // Preconfirmations carry Solana wire format, which can be version 1
  it("decodes a version 1 transaction payload", async () => {
    const feePayer = await generateKeyPairSigner();
    // Built the way the SDK builds v1 transactions, header config included
    const message = createTxMessage({
      version: 1,
      feePayer,
      lifetime: {
        blockhash: "11111111111111111111111111111111" as Blockhash,
        lastValidBlockHeight: 1n,
      },
      instructions: [],
    });
    const signed = await signTransactionMessageWithSigners(message);
    const txBytes = new Uint8Array(getTransactionEncoder().encode(signed));

    const notif = decodePreconfFrame(buildFrame(5n, 0n, txBytes));
    expect(Object.keys(notif.transaction.signatures)).toEqual([
      feePayer.address,
    ]);
    expect(notif.transactionBytes).toEqual(txBytes);
  });

  // Sanity: kit encoder/decoder round-trips our hand-built bytes.
  it("round-trips through the kit transaction codec", () => {
    const txBytes = buildTxBytes();
    const notif = decodePreconfFrame(buildFrame(9n, 1n, txBytes));
    const reEncoded = getTransactionEncoder().encode(notif.transaction);
    expect(new Uint8Array(reEncoded)).toEqual(txBytes);
  });
});

// ── Mock WebSocket (supports text + binary frames) ───────────────────

let mockInstances: MockWebSocket[] = [];

class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  binaryType = "nodebuffer";
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  sent: string[] = [];
  closeCallCount = 0;

  constructor(public url: string) {
    mockInstances.push(this);
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

  _receiveJson(data: unknown) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }

  _receiveBinary(bytes: Uint8Array) {
    if (this.onmessage) this.onmessage({ data: bytes });
  }
}

(globalThis as any).WebSocket = MockWebSocket;

const TEST_URL = "wss://beta.helius-rpc.com/?api-key=test-key";
const lastWs = (): MockWebSocket => mockInstances[mockInstances.length - 1];
const respondToLatest = (ws: MockWebSocket, result: unknown) => {
  const lastSent = JSON.parse(ws.sent[ws.sent.length - 1]);
  ws._receiveJson({ jsonrpc: "2.0", id: lastSent.id, result });
};

// ── makePreconfWsClient tests ────────────────────────────────────────

describe("makePreconfWsClient", () => {
  beforeEach(() => {
    mockInstances = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends preconfSubscribe with NO params and returns the subscription id", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 42);
    const sub = await subPromise;

    const sent = JSON.parse(lastWs().sent[0]);
    expect(sent.method).toBe("preconfSubscribe");
    expect(sent.params).toBeUndefined(); // streams all — no filters
    expect(sub.subscriptionId).toBe(42);

    client.close();
  });

  it("delivers decoded binary notifications via AsyncIterable in order", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    ws._receiveBinary(buildFrame(100n, 0n, buildTxBytes()));
    ws._receiveBinary(buildFrame(101n, 3n, buildTxBytes()));

    const iter = sub[Symbol.asyncIterator]();
    const n1 = await iter.next();
    const n2 = await iter.next();
    expect(n1.value.slot).toBe(100n);
    expect(n1.value.transactionIndex).toBe(0n);
    expect(n2.value.slot).toBe(101n);
    expect(n2.value.transactionIndex).toBe(3n);

    client.close();
  });

  it("ignores malformed binary frames without tearing down the stream", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    ws._receiveBinary(new Uint8Array(4)); // too short — dropped
    ws._receiveBinary(buildFrame(200n, 1n, buildTxBytes())); // valid

    const iter = sub[Symbol.asyncIterator]();
    const n1 = await iter.next();
    expect(n1.value.slot).toBe(200n);

    client.close();
  });

  it("unsubscribe closes the connection and completes the iterator", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 5);
    const sub = await subPromise;

    const ws = lastWs();
    await expect(sub.unsubscribe()).resolves.toBe(true);
    // Closing the connection removes its only subscription server-side
    expect(ws.closeCallCount).toBe(1);

    const iter = sub[Symbol.asyncIterator]();
    const next = await iter.next();
    expect(next.done).toBe(true);

    client.close();
  });

  it("close() closes the socket", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await subPromise;

    const ws = lastWs();
    client.close();
    expect(ws.closeCallCount).toBeGreaterThan(0);
  });

  /** Subscribe and acknowledge on the socket the subscription opened. */
  const subscribeWith = async (
    client: ReturnType<typeof makePreconfWsClient>,
    id: number,
    filter?: Parameters<typeof client.preconfSubscribe>[0]
  ) => {
    const promise = client.preconfSubscribe(filter);
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();
    respondToLatest(ws, id);
    return { sub: await promise, ws };
  };

  it("sends the filter as the first param", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const filter = {
      includeBam: false,
      failed: false,
      regionInclude: ["ewr" as const, "fra" as const],
      accountInclude: ["9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
      instructions: [
        {
          programId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
          memcmp: [
            { offset: 0, bytes: "66063d1201daebea", encoding: "hex" as const },
          ],
        },
      ],
    };
    const { ws } = await subscribeWith(client, 7, filter);

    expect(JSON.parse(ws.sent[0])).toEqual({
      jsonrpc: "2.0",
      id: 1,
      method: "preconfSubscribe",
      params: [filter],
    });
    client.close();
  });

  it("rejects with the server's error for an invalid filter", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe({
      regionInclude: ["xyz" as never],
    });
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();
    ws._receiveJson({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32602, message: "invalid region code: xyz" },
    });

    await expect(promise).rejects.toMatchObject({
      message: "invalid region code: xyz",
      code: -32602,
    });
    expect(ws.closeCallCount).toBe(1);
    client.close();
  });

  it("gives each subscription its own connection so frames reach the right one", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const a = await subscribeWith(client, 1, { includeBam: false });
    const b = await subscribeWith(client, 2, { failed: true });
    expect(a.ws).not.toBe(b.ws);

    a.ws._receiveBinary(buildFrame(10n, 0n, buildTxBytes()));
    b.ws._receiveBinary(buildFrame(20n, 0n, buildTxBytes()));

    expect((await a.sub[Symbol.asyncIterator]().next()).value.slot).toBe(10n);
    expect((await b.sub[Symbol.asyncIterator]().next()).value.slot).toBe(20n);
    client.close();
  });

  it("preconfUnsubscribe(id) stops that subscription only", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const a = await subscribeWith(client, 1);
    const b = await subscribeWith(client, 2);

    await expect(client.preconfUnsubscribe(1)).resolves.toBe(true);
    expect(a.ws.closeCallCount).toBe(1);
    expect(b.ws.closeCallCount).toBe(0);

    await expect(client.preconfUnsubscribe(404)).resolves.toBe(false);
    client.close();
  });

  it("unsubscribe closes right away and leaves no timers behind", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 3);

    await expect(sub.unsubscribe()).resolves.toBe(true);
    expect(ws.sent).toHaveLength(1); // Only the subscribe; the close does the rest
    expect(ws.closeCallCount).toBe(1);
    expect(jest.getTimerCount()).toBe(0); // Nothing left to keep Node alive
    client.close();
  });

  it("close() also closes a subscribe still waiting for its ack", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();

    client.close();
    await expect(promise).rejects.toThrow(/closed/);
    expect(ws.closeCallCount).toBe(1);
  });

  it("fails the stream when the connection drops", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 4);
    ws.readyState = MockWebSocket.CLOSED;
    ws.onclose?.();

    await expect(sub[Symbol.asyncIterator]().next()).rejects.toThrow(
      /closed unexpectedly/
    );
    client.close();
  });

  it("unsubscribes when a for-await loop exits early", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 6);
    ws._receiveBinary(buildFrame(1n, 0n, buildTxBytes()));

    for await (const event of sub) {
      expect(event.slot).toBe(1n);
      break;
    }

    expect(ws.closeCallCount).toBe(1);
    client.close();
  });

  it("resolves false for an unsubscribe of a subscription that already ended", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 8);

    const [first, second] = await Promise.all([
      sub.unsubscribe(),
      client.preconfUnsubscribe(8),
    ]);
    expect([first, second]).toEqual([true, false]);
    expect(ws.closeCallCount).toBe(1);
    client.close();
  });

  it("ends cleanly when a close event follows an unsubscribe", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 9);
    const it = sub[Symbol.asyncIterator]();

    await sub.unsubscribe();
    ws.onclose?.(); // The close event arrives after the stream already ended

    await expect(it.next()).resolves.toEqual({ value: undefined, done: true });
    client.close();
  });

  it("times out a subscribe that is never acknowledged", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    const assertion = expect(promise).rejects.toThrow(
      "preconfSubscribe timed out"
    );
    await jest.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(lastWs().closeCallCount).toBe(1);
    client.close();
  });

  it("throws rather than guess when several live subscriptions report one id", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const a = await subscribeWith(client, 1);
    const b = await subscribeWith(client, 1);

    await expect(client.preconfUnsubscribe(1)).rejects.toThrow(
      /matches 2 subscriptions/
    );
    expect(a.ws.closeCallCount + b.ws.closeCallCount).toBe(0);

    // The handle always targets its own connection
    await expect(b.sub.unsubscribe()).resolves.toBe(true);
    expect(a.ws.closeCallCount).toBe(0);
    expect(b.ws.closeCallCount).toBe(1);
    client.close();
  });

  it("rejects a consumer parked on next() when the connection drops", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 2);
    const parked = sub[Symbol.asyncIterator]().next(); // Waiting for a frame

    ws.readyState = MockWebSocket.CLOSED;
    ws.onclose?.();
    await expect(parked).rejects.toThrow(/closed unexpectedly/);
    client.close();
  });

  it("settles every concurrent consumer", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 2);
    const first = sub[Symbol.asyncIterator]().next();
    const second = sub[Symbol.asyncIterator]().next();

    ws._receiveBinary(buildFrame(1n, 0n, buildTxBytes()));
    ws._receiveBinary(buildFrame(2n, 0n, buildTxBytes()));
    expect((await first).value.slot).toBe(1n);
    expect((await second).value.slot).toBe(2n);

    const third = sub[Symbol.asyncIterator]().next();
    const fourth = sub[Symbol.asyncIterator]().next();
    client.close();
    await expect(third).resolves.toEqual({ value: undefined, done: true });
    await expect(fourth).resolves.toEqual({ value: undefined, done: true });
  });

  it.each([
    ["no result", { jsonrpc: "2.0", id: 1 }],
    ["a null result", { jsonrpc: "2.0", id: 1, result: null }],
    ["a string result", { jsonrpc: "2.0", id: 1, result: "24040" }],
  ])("rejects and closes on an ack with %s", async (_label, ack) => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();
    ws._receiveJson(ack);

    await expect(promise).rejects.toThrow(
      "preconfSubscribe returned no subscription id"
    );
    expect(ws.closeCallCount).toBe(1); // Nothing left billing
    client.close();
  });

  it("routes an id:null error to the pending subscribe", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    lastWs()._receiveJson({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32005, message: "rate limited" },
    });
    await expect(promise).rejects.toMatchObject({
      message: "rate limited",
      code: -32005,
    });
    client.close();
  });

  it("rejects an unserializable filter without opening a connection", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe({
      instructions: [{ programId: "P", dataSize: 8n as unknown as number }],
    });
    await expect(promise).rejects.toThrow(/BigInt/);
    expect(mockInstances).toHaveLength(0);
    client.close();
  });

  it("sends the filter as it was when subscribe was called", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const filter = { accountInclude: ["A"] };
    const promise = client.preconfSubscribe(filter);
    filter.accountInclude = []; // Reused or reset before the socket opens
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();
    expect(JSON.parse(ws.sent[0]).params).toEqual([{ accountInclude: ["A"] }]);
    respondToLatest(ws, 1);
    await promise;
    client.close();
  });

  it("drops buffered notifications on unsubscribe", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 2);
    ws._receiveBinary(buildFrame(1n, 0n, buildTxBytes()));

    await sub.unsubscribe();
    await expect(sub[Symbol.asyncIterator]().next()).resolves.toEqual({
      value: undefined,
      done: true,
    });
    client.close();
  });

  it("keeps buffered notifications readable after a connection error", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { sub, ws } = await subscribeWith(client, 2);
    ws._receiveBinary(buildFrame(7n, 0n, buildTxBytes()));
    ws.readyState = MockWebSocket.CLOSED;
    ws.onclose?.();

    const it = sub[Symbol.asyncIterator]();
    expect((await it.next()).value.slot).toBe(7n);
    await expect(it.next()).rejects.toThrow(/closed unexpectedly/);
    client.close();
  });

  it("falls back to a JSON-RPC ping when the socket has no ping()", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const { ws } = await subscribeWith(client, 2);
    await jest.advanceTimersByTimeAsync(30_000);
    expect(JSON.parse(ws.sent[ws.sent.length - 1])).toEqual({
      jsonrpc: "2.0",
      id: 0,
      method: "ping",
    });
    client.close();
  });

  it("ignores non-object JSON frames", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    const ws = lastWs();
    ws.onmessage?.({ data: "null" }); // Must not throw
    respondToLatest(ws, 3);
    await expect(promise).resolves.toMatchObject({ subscriptionId: 3 });
    client.close();
  });

  it("times out a subscribe whose handshake never completes", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const promise = client.preconfSubscribe();
    const ws = lastWs();
    ws.onopen = null; // Drop the open event before the mock fires it
    const assertion = expect(promise).rejects.toThrow(
      "preconfSubscribe timed out"
    );
    await jest.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(ws.sent).toHaveLength(0);
    expect(ws.closeCallCount).toBe(1);
    client.close();
  });

  it("uses an injected WebSocket implementation", async () => {
    const opened: string[] = [];
    class Injected extends MockWebSocket {
      constructor(url: string) {
        super(url);
        opened.push(url);
      }
    }
    const client = makePreconfWsClientForApiKey("k", { WebSocket: Injected });
    const promise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await promise;
    expect(opened).toEqual([`${PRECONF_WEBSOCKET_URL}k`]);
    client.close();
  });

  it("explains how to supply a WebSocket when none is available", async () => {
    const saved = (globalThis as { WebSocket?: unknown }).WebSocket;
    delete (globalThis as { WebSocket?: unknown }).WebSocket;
    try {
      await expect(
        makePreconfWsClient(TEST_URL).preconfSubscribe()
      ).rejects.toThrow(/pass `WebSocket` from the `ws` package/);
    } finally {
      (globalThis as { WebSocket?: unknown }).WebSocket = saved;
    }
  });

  describe("getPreConfCoverage", () => {
    const coverage = {
      networkSharePercent: 45.84,
      coverageByRegion: { fra: 0.27, ams: 0.21 },
    };
    const fetchMock = jest.fn();

    beforeEach(() => {
      fetchMock.mockReset();
      (globalThis as any).fetch = fetchMock;
    });

    it("POSTs the JSON-RPC method over HTTPS to the subscription host", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: "2.0", id: 1, result: coverage }),
      });

      const client = makePreconfWsClientForApiKey("abc123");
      await expect(client.getPreConfCoverage()).resolves.toEqual(coverage);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://beta.helius-rpc.com/?api-key=abc123");
      expect(init.method).toBe("POST");
      expect(init.headers["User-Agent"]).toMatch(/^helius-node-sdk\//);
      expect(JSON.parse(init.body)).toEqual({
        jsonrpc: "2.0",
        id: 1,
        method: "getPreConfCoverage",
      });
    });

    it("rewrites an upper-case WSS scheme to HTTPS", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: "2.0", id: 1, result: coverage }),
      });
      await makePreconfWsClient(
        "WSS://beta.helius-rpc.com/?api-key=k"
      ).getPreConfCoverage();
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://beta.helius-rpc.com/?api-key=k"
      );
    });

    it("reads the message from a JSON error body", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () =>
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32401, message: "invalid api key provided" },
          }),
      });
      await expect(
        makePreconfWsClient(TEST_URL).getPreConfCoverage()
      ).rejects.toThrow(
        "getPreConfCoverage HTTP 401: invalid api key provided"
      );
    });

    it("throws on an HTTP error", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      await expect(
        makePreconfWsClient(TEST_URL).getPreConfCoverage()
      ).rejects.toThrow("getPreConfCoverage HTTP 401: Unauthorized");
    });

    it("throws on a JSON-RPC error", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32601, message: "Method not found" },
        }),
      });
      await expect(
        makePreconfWsClient(TEST_URL).getPreConfCoverage()
      ).rejects.toMatchObject({ message: "Method not found", code: -32601 });
    });
  });

  it("unexpected close rejects a for-await loop waiting for the next notification", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    const sub = await subPromise;

    const ws = lastWs();
    const slots: bigint[] = [];
    const consume = (async () => {
      for await (const notif of sub) slots.push(notif.slot);
    })();

    ws._receiveBinary(buildFrame(100n, 0n, buildTxBytes()));
    // Let the loop take slot 100 and wait in next() again
    await jest.advanceTimersByTimeAsync(0);

    // Server drops the connection; the client never called close()
    ws.onclose!();

    await expect(consume).rejects.toThrow(
      "Pre Confirmations WebSocket connection closed unexpectedly"
    );
    expect(slots).toEqual([100n]);
  });

  it("makePreconfWsClientForApiKey connects to the Gatekeeper endpoint", async () => {
    const client = makePreconfWsClientForApiKey("abc123");
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 1);
    await subPromise;

    expect(lastWs().url).toBe(`${PRECONF_WEBSOCKET_URL}abc123`);
    expect(lastWs().url).toBe("wss://beta.helius-rpc.com/?api-key=abc123");

    client.close();
  });
});
