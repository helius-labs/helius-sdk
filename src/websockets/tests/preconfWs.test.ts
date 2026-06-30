import {
  decodePreconfFrame,
  makePreconfWsClient,
  makePreconfWsClientForApiKey,
  PRECONF_WEBSOCKET_URL,
  PreconfStatus,
} from "../preconfWs";
import { getTransactionEncoder } from "@solana/kit";

// ── Build a real bincode(VersionedTransaction)-equivalent wire payload ──
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

  it("preconfUnsubscribe sends JSON-RPC and completes the iterator", async () => {
    const client = makePreconfWsClient(TEST_URL);
    const subPromise = client.preconfSubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(lastWs(), 5);
    const sub = await subPromise;

    const ws = lastWs();
    const unsubPromise = sub.unsubscribe();
    await jest.advanceTimersByTimeAsync(0);
    respondToLatest(ws, true);
    const result = await unsubPromise;

    expect(result).toBe(true);
    const unsubMsg = JSON.parse(ws.sent[ws.sent.length - 1]);
    expect(unsubMsg.method).toBe("preconfUnsubscribe");
    expect(unsubMsg.params).toBeUndefined();

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
