import {
  makeParsedStreamsClient,
  PARSED_STREAMS_DISCOVERY_URL,
  PARSED_STREAMS_URL,
  type ParsedStreamsError,
} from "../parsedStreams";

// ── Mock WebSocket ────────────────────────────────────────────────────

interface SentMessage {
  id: number;
  method: string;
  params: unknown[];
}

/** The global WebSocket slot, for tests that install or remove one. */
const globalWs = globalThis as { WebSocket?: unknown };

let sockets: MockWebSocket[] = [];
let failNextOpen = 0;
let hangNextOpen = 0;

class MockWebSocket {
  readyState = 0;
  sent: SentMessage[] = [];
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(public url: string) {
    sockets.push(this);
    const fail = failNextOpen > 0;
    if (fail) failNextOpen--;
    if (hangNextOpen > 0) {
      hangNextOpen--; // Upgrade never answers: no open, error, or close
      return;
    }
    Promise.resolve().then(() => {
      if (fail) {
        this.readyState = 3;
        this.onerror?.();
        this.onclose?.({ code: 1006 });
      } else {
        this.readyState = 1;
        this.onopen?.();
      }
    });
  }

  send(data: string) {
    if (this.readyState !== 1) throw new Error("socket not open");
    this.sent.push(JSON.parse(data));
  }

  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.({ code: 1005 });
  }

  /** Server-initiated close with a specific code. */
  serverClose(code: number) {
    this.readyState = 3;
    this.onclose?.({ code });
  }

  receive(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }

  /** Respond to the most recent request. */
  reply(result: unknown) {
    const { id } = this.sent[this.sent.length - 1];
    this.receive({ jsonrpc: "2.0", id, result });
  }

  replyError(code: number, message: string) {
    const { id } = this.sent[this.sent.length - 1];
    this.receive({ jsonrpc: "2.0", id, error: { code, message } });
  }

  notify(subscription: number, slot: number, signature = `sig-${slot}`) {
    this.receive({
      jsonrpc: "2.0",
      method: "parsedTransactionNotification",
      params: {
        subscription,
        result: {
          context: { slot },
          value: { transaction: { signature, slot }, instructions: [] },
        },
      },
    });
  }
}

const WS = MockWebSocket as unknown as new (url: string) => WebSocket;
const last = () => sockets[sockets.length - 1];

/** Advance fake timers in small steps until `cond` holds. */
const until = async (cond: () => boolean, maxMs = 120_000) => {
  for (let t = 0; t <= maxMs; t += 10) {
    if (cond()) return;
    await jest.advanceTimersByTimeAsync(10);
  }
  throw new Error("condition not met");
};

/** Subscribe and answer the request with `id`. */
const subscribeWith = async (
  client: ReturnType<typeof makeParsedStreamsClient>,
  id: number,
  filter: Record<string, unknown> = { programs: ["P1"] }
) => {
  const before = last()?.readyState === 1 ? last().sent.length : 0;
  const promise = client.parsedTransactionSubscribe(filter);
  // Wait for this request (sends are paced), then answer it
  await until(() => last()?.readyState === 1 && last().sent.length > before);
  last().reply(id);
  return promise;
};

beforeEach(() => {
  jest.useFakeTimers();
  sockets = [];
  failNextOpen = 0;
  hangNextOpen = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Subscribe / notifications / unsubscribe ───────────────────────────

describe("parsedTransactionSubscribe", () => {
  it("connects to the Gatekeeper URL and sends the filter and options", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.parsedTransactionSubscribe(
      { programs: ["JUP"], includeCpi: false },
      { details: "matched" }
    );
    await until(() => last()?.sent.length === 1);

    expect(last().url).toBe(`${PARSED_STREAMS_URL}KEY`);
    expect(last().sent[0]).toMatchObject({
      jsonrpc: "2.0",
      method: "parsedTransactionSubscribe",
      params: [
        { programs: ["JUP"], includeCpi: false },
        { details: "matched" },
      ],
    });

    last().reply(23);
    const sub = await promise;
    expect(sub.subscriptionId).toBe(23);
    client.close();
  });

  it("omits the options param when none are given", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    await subscribeWith(client, 1);
    expect(last().sent[0].params).toEqual([{ programs: ["P1"] }]);
    client.close();
  });

  it("delivers notifications for its own subscription in order", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 7);

    last().notify(99, 1); // another subscription's id: ignored
    last().notify(7, 10);
    last().notify(7, 11);

    const it = sub[Symbol.asyncIterator]();
    expect((await it.next()).value).toMatchObject({ context: { slot: 10 } });
    expect((await it.next()).value).toMatchObject({ context: { slot: 11 } });
    client.close();
  });

  it("rejects with the JSON-RPC error code when the filter is rejected", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.parsedTransactionSubscribe({ programs: ["bad"] });
    await until(() => last()?.sent.length === 1);
    last().replyError(-32602, "invalid pubkey at programs[0]");

    await expect(promise).rejects.toMatchObject({
      message: "invalid pubkey at programs[0]",
      code: -32602,
    } satisfies Partial<ParsedStreamsError>);
    client.close();
  });

  it("unsubscribes by id and ends the iterator", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 5);
    const it = sub[Symbol.asyncIterator]();

    const result = sub.unsubscribe();
    await until(() => last().sent.length === 2);
    expect(last().sent[1]).toMatchObject({
      method: "parsedTransactionUnsubscribe",
      params: [5],
    });
    last().reply(true);

    await expect(result).resolves.toBe(true);
    await expect(it.next()).resolves.toEqual({
      value: undefined,
      done: true,
    });
    client.close();
  });

  it("unsubscribes via parsedTransactionUnsubscribe(id)", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    await subscribeWith(client, 5);

    const result = client.parsedTransactionUnsubscribe(5);
    await until(() => last().sent.length === 2);
    last().reply(true);
    await expect(result).resolves.toBe(true);
    await expect(client.parsedTransactionUnsubscribe(404)).resolves.toBe(false);
    client.close();
  });

  it("unsubscribes when a for-await loop exits early", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 3);
    last().notify(3, 1);

    for await (const n of sub) {
      expect(n.context.slot).toBe(1);
      break;
    }

    await until(() => last().sent.length === 2);
    expect(last().sent[1]).toMatchObject({
      method: "parsedTransactionUnsubscribe",
      params: [3],
    });
    client.close();
  });

  it("paces client messages to stay under 10 per second", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const a = client.parsedTransactionSubscribe({ programs: ["A"] });
    const b = client.parsedTransactionSubscribe({ programs: ["B"] });
    await until(() => last()?.sent.length === 1);

    await jest.advanceTimersByTimeAsync(50);
    expect(last().sent).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(60);
    expect(last().sent).toHaveLength(2);
    client.close();
    await expect(a).rejects.toThrow("Parsed Streams client closed");
    await expect(b).rejects.toThrow("Parsed Streams client closed");
  });

  it("rejects a request whose paced send finds the connection closed", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const a = client.parsedTransactionSubscribe({ programs: ["A"] });
    const b = client.parsedTransactionSubscribe({ programs: ["B"] });
    await until(() => last()?.sent.length === 1);
    last().reply(1);
    await a;

    last().serverClose(1001); // b is still waiting for its send slot
    const assertion = expect(b).rejects.toThrow(
      "Parsed Streams connection closed"
    );
    await jest.advanceTimersByTimeAsync(200);
    await assertion;
    client.close();
  });

  it("delivers what it buffered, then fails, when the consumer falls too far behind", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 2);
    for (let slot = 0; slot <= 10_000; slot++) last().notify(2, slot);

    const it = sub[Symbol.asyncIterator]();
    for (let slot = 0; slot < 10_000; slot++) {
      expect((await it.next()).value?.context.slot).toBe(slot);
    }
    await expect(it.next()).rejects.toThrow(/consumer is too slow/);
    // The overflowing subscription is also unsubscribed server-side
    await until(() => last().sent.length === 2);
    expect(last().sent[1]).toMatchObject({
      method: "parsedTransactionUnsubscribe",
      params: [2],
    });
    client.close();
  });
});

// ── Reconnects ────────────────────────────────────────────────────────

describe("reconnects", () => {
  it.each([1000, 1001, 1006])(
    "reconnects, resubscribes, and keeps the iterator alive after close %i",
    async (code) => {
      const onReconnect = jest.fn();
      const client = makeParsedStreamsClient("KEY", {
        WebSocket: WS,
        onReconnect,
      });
      const sub = await subscribeWith(client, 1, { programs: ["JUP"] });
      const it = sub[Symbol.asyncIterator]();
      last().notify(1, 100);
      await it.next();

      const first = last();
      first.serverClose(code);

      // Backoff, then a new socket that resends the same filter
      await until(() => sockets.length === 2 && last().sent.length === 1);
      expect(last().sent[0]).toMatchObject({
        method: "parsedTransactionSubscribe",
        params: [{ programs: ["JUP"] }],
      });
      last().reply(42);
      await until(() => onReconnect.mock.calls.length === 1);

      expect(onReconnect).toHaveBeenCalledWith({
        closeCode: code,
        lastSlot: 100,
      });
      expect(sub.subscriptionId).toBe(42);

      last().notify(42, 105);
      expect((await it.next()).value).toMatchObject({ context: { slot: 105 } });
      client.close();
    }
  );

  it("fails the stream on a slow-consumer close (1008) without reconnecting", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1008);

    await expect(sub[Symbol.asyncIterator]().next()).rejects.toThrow(
      /fell more than 2048 notifications behind/
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(sockets).toHaveLength(1);
  });

  it("fails the stream instead of reconnecting when reconnect is off", async () => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      reconnect: false,
    });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1001);

    await expect(sub[Symbol.asyncIterator]().next()).rejects.toThrow(
      /closed \(code 1001\)/
    );
    expect(sockets).toHaveLength(1);
  });

  it("gives up after maxReconnectAttempts consecutive failures", async () => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      maxReconnectAttempts: 3,
    });
    const sub = await subscribeWith(client, 1);
    failNextOpen = 3;
    last().serverClose(1006);

    const assertion = expect(
      sub[Symbol.asyncIterator]().next()
    ).rejects.toThrow(/gave up after 3 reconnect attempts/);
    await jest.advanceTimersByTimeAsync(60_000);
    await assertion;
    expect(sockets).toHaveLength(4); // original + 3 failed attempts
  });

  it("backs off exponentially between failed attempts", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    await subscribeWith(client, 1);
    failNextOpen = 2;
    last().serverClose(1006);

    await jest.advanceTimersByTimeAsync(990);
    expect(sockets).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(20); // 1s: attempt 1 (fails)
    expect(sockets).toHaveLength(2);
    await jest.advanceTimersByTimeAsync(1_980);
    expect(sockets).toHaveLength(2);
    await jest.advanceTimersByTimeAsync(40); // +2s: attempt 2 (fails)
    expect(sockets).toHaveLength(3);
    await jest.advanceTimersByTimeAsync(4_010); // +4s: attempt 3 (opens)
    expect(sockets).toHaveLength(4);
    client.close();
  });

  it("fails only the subscription the server now rejects", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const a = await subscribeWith(client, 1, { programs: ["A"] });
    const b = await subscribeWith(client, 2, { programs: ["B"] });
    last().serverClose(1001);

    await until(() => sockets.length === 2 && last().sent.length === 1);
    last().replyError(-32602, "unknown field");
    await until(() => last().sent.length === 2);
    last().reply(20);

    await expect(a[Symbol.asyncIterator]().next()).rejects.toThrow(
      "unknown field"
    );
    await until(() => b.subscriptionId === 20);
    last().notify(20, 7);
    expect((await b[Symbol.asyncIterator]().next()).value).toMatchObject({
      context: { slot: 7 },
    });
    client.close();
  });

  it("retries the reconnect when resubscribing hits a transient error", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1001);

    await until(() => sockets.length === 2 && last().sent.length === 1);
    last().replyError(-32001, "server not ready");

    await until(() => sockets.length === 3 && last().sent.length === 1);
    last().reply(9);
    await until(() => sub.subscriptionId === 9);
    client.close();
  });

  it("does not reconnect when no subscriptions are open", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    const done = sub.unsubscribe();
    await until(() => last().sent.length === 2);
    last().reply(true);
    await done;

    last().serverClose(1000);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(sockets).toHaveLength(1);
  });
});

// ── Lifecycle edge cases ──────────────────────────────────────────────

/** A `ws`-package-style socket: exposes server pings and terminate(). */
class PingAwareSocket extends MockWebSocket {
  pingListeners: (() => void)[] = [];
  terminated = 0;

  on(event: string, listener: () => void) {
    if (event === "ping") this.pingListeners.push(listener);
  }

  ping() {
    this.pingListeners.forEach((l) => l());
  }

  terminate() {
    this.terminated++;
    this.serverClose(1006);
  }
}

describe("lifecycle edge cases", () => {
  it("cancels a subscription unsubscribed while its resubscribe ack is in flight", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1001);
    await until(() => sockets.length === 2 && last().sent.length === 1);

    await sub.unsubscribe(); // Before the server acks the resubscribe
    last().reply(77);

    await until(() => last().sent.length === 2);
    expect(last().sent[1]).toMatchObject({
      method: "parsedTransactionUnsubscribe",
      params: [77],
    });
    expect(sub.subscriptionId).toBeUndefined();
    client.close();
  });

  it("keeps streaming when onReconnect throws", async () => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      onReconnect: () => {
        throw new Error("user callback bug");
      },
    });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1000);
    await until(() => sockets.length === 2 && last().sent.length === 1);
    last().reply(2);
    await until(() => sub.subscriptionId === 2);

    last().notify(2, 50);
    expect((await sub[Symbol.asyncIterator]().next()).value).toMatchObject({
      context: { slot: 50 },
    });
    client.close();
  });

  it("times out an unanswered request and reconnects the dead connection", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);

    const hung = client.parsedTransactionSubscribe({ programs: ["B"] });
    const assertion = expect(hung).rejects.toThrow(
      "Parsed Streams parsedTransactionSubscribe timed out"
    );
    await jest.advanceTimersByTimeAsync(15_100);
    await assertion;

    // The silent connection is dropped and the existing subscription restored
    await until(() => sockets.length === 2 && last().sent.length === 1);
    last().reply(3);
    await until(() => sub.subscriptionId === 3);
    client.close();
  });

  it("treats a JSON-RPC error without a code as transient on resubscribe", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1001);
    await until(() => sockets.length === 2 && last().sent.length === 1);
    const { id } = last().sent[0];
    last().receive({ jsonrpc: "2.0", id, error: { message: "busy" } });

    await until(() => sockets.length === 3 && last().sent.length === 1);
    last().reply(4);
    await until(() => sub.subscriptionId === 4);
    client.close();
  });

  it("restores existing subscriptions right away when a new subscribe lands mid-backoff", async () => {
    const onReconnect = jest.fn();
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      onReconnect,
    });
    const old = await subscribeWith(client, 1, { programs: ["OLD"] });
    last().notify(1, 100);
    await old[Symbol.asyncIterator]().next();

    failNextOpen = 3; // Push the backoff out to 8s
    last().serverClose(1006);
    await until(() => sockets.length === 4);

    const fresh = client.parsedTransactionSubscribe({ programs: ["NEW"] });
    await until(() => sockets.length === 5 && last().sent.length >= 1);
    // Both go out on the new connection well before the 8s backoff timer
    await until(() => last().sent.length === 2, 1_000);
    const methods = last().sent.map(
      (m) => (m.params[0] as { programs: string[] }).programs[0]
    );
    expect(methods.sort()).toEqual(["NEW", "OLD"]);
    for (const m of last().sent) {
      last().receive({
        jsonrpc: "2.0",
        id: m.id,
        result:
          (m.params[0] as { programs: string[] }).programs[0] === "OLD"
            ? 10
            : 11,
      });
    }
    await fresh;
    await until(() => onReconnect.mock.calls.length === 1);
    // The gap starts at the slot before the outage, not a later one
    expect(onReconnect).toHaveBeenCalledWith({
      closeCode: 1006,
      lastSlot: 100,
    });
    expect(old.subscriptionId).toBe(10);
    client.close();
  });

  it("counts a throwing WebSocket constructor as a failed connection", async () => {
    let throwsLeft = 1;
    const Flaky = function (this: unknown, url: string) {
      if (throwsLeft-- > 0) throw new Error("bad url");
      return new MockWebSocket(url);
    } as unknown as new (url: string) => WebSocket;
    const client = makeParsedStreamsClient("KEY", { WebSocket: Flaky });

    await expect(
      client.parsedTransactionSubscribe({ programs: ["A"] })
    ).rejects.toThrow("bad url");
    // Not cached: the next attempt connects normally
    await subscribeWith(client, 1);
    expect(sockets).toHaveLength(1);
    client.close();
  });

  describe("liveness with a ws-style socket", () => {
    const PingWS = PingAwareSocket as unknown as new (url: string) => WebSocket;

    it("terminates and reconnects after 60s with no messages or pings", async () => {
      const client = makeParsedStreamsClient("KEY", { WebSocket: PingWS });
      const sub = await subscribeWith(client, 1);
      const first = last() as PingAwareSocket;

      await jest.advanceTimersByTimeAsync(76_000);
      expect(first.terminated).toBe(1);
      await until(() => sockets.length === 2 && last().sent.length === 1);
      last().reply(2);
      await until(() => sub.subscriptionId === 2);
      client.close();
    });

    it("stays connected while the server keeps pinging", async () => {
      const client = makeParsedStreamsClient("KEY", { WebSocket: PingWS });
      await subscribeWith(client, 1);
      const socket = last() as PingAwareSocket;

      for (let i = 0; i < 8; i++) {
        await jest.advanceTimersByTimeAsync(15_000);
        socket.ping();
      }
      expect(socket.terminated).toBe(0);
      expect(sockets).toHaveLength(1);
      client.close();
    });
  });
});

// ── PR #358 review regressions ────────────────────────────────────────

describe("reconnect budget", () => {
  /** Answer the pending resubscribe on the newest socket. */
  const ackResubscribe = async (id: number) => {
    await until(() => last().readyState === 1 && last().sent.length === 1);
    last().reply(id);
  };

  it("starts a fresh budget for subscriptions made after a give-up", async () => {
    const onReconnect = jest.fn();
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      maxReconnectAttempts: 2,
      onReconnect,
    });
    const first = await subscribeWith(client, 1);
    last().notify(1, 100);
    await first[Symbol.asyncIterator]().next();

    failNextOpen = 2;
    last().serverClose(1006);
    const gaveUp = expect(first[Symbol.asyncIterator]().next()).rejects.toThrow(
      /gave up after 2 reconnect attempts/
    );
    await jest.advanceTimersByTimeAsync(10_000);
    await gaveUp;

    // Same client, new subscription, routine idle close: it must reconnect
    const second = await subscribeWith(client, 5);
    last().notify(5, 200);
    await second[Symbol.asyncIterator]().next();
    const before = sockets.length;
    last().serverClose(1000);

    await until(() => sockets.length === before + 1);
    await ackResubscribe(6);
    await until(() => onReconnect.mock.calls.length === 1);
    // No stale outage from the first subscription
    expect(onReconnect).toHaveBeenCalledWith({
      closeCode: 1000,
      lastSlot: 200,
    });
    expect(second.subscriptionId).toBe(6);
    client.close();
  });

  it("gives up on a server that accepts the resubscribe and immediately closes", async () => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      maxReconnectAttempts: 3,
    });
    const sub = await subscribeWith(client, 1);
    const gaveUp = expect(sub[Symbol.asyncIterator]().next()).rejects.toThrow(
      /gave up after 3 reconnect attempts/
    );

    last().serverClose(1006);
    for (let i = 0; i < 3; i++) {
      await until(() => sockets.length === i + 2);
      await ackResubscribe(10 + i);
      await until(() => sub.subscriptionId === 10 + i);
      last().serverClose(1006); // Flap before the connection proves stable
    }
    await gaveUp;
    expect(sockets).toHaveLength(4); // original + 3 attempts, then no more
  });

  it.each([
    [
      "staying up for 30s",
      async (_id: number) => {
        await jest.advanceTimersByTimeAsync(30_000);
      },
    ],
    ["delivering a notification", async (id: number) => last().notify(id, 1)],
  ])("resets the budget after %s", async (_label, prove) => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      maxReconnectAttempts: 1,
    });
    const sub = await subscribeWith(client, 1);

    // Each reconnect uses the single allowed attempt, then proves stable
    for (let i = 0; i < 3; i++) {
      last().serverClose(1006);
      await until(() => sockets.length === i + 2);
      await ackResubscribe(100 + i);
      await until(() => sub.subscriptionId === 100 + i);
      await prove(100 + i);
    }
    expect(sub.subscriptionId).toBe(102);
    client.close();
  });
});

describe("ack applied after its connection closed", () => {
  it("rejects a first subscribe whose connection closed right after the ack", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.parsedTransactionSubscribe({ programs: ["A"] });
    await until(() => last()?.sent.length === 1);
    last().reply(1);
    last().serverClose(1006); // Same tick: before the ack is applied

    await expect(promise).rejects.toThrow("Parsed Streams connection closed");
    client.close();
  });

  it("retries a resubscribe whose connection closed right after the ack", async () => {
    const onReconnect = jest.fn();
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      onReconnect,
    });
    const sub = await subscribeWith(client, 1);
    last().serverClose(1001);

    await until(() => sockets.length === 2 && last().sent.length === 1);
    last().reply(2);
    last().serverClose(1006); // Same tick: the id 2 is already dead
    expect(onReconnect).not.toHaveBeenCalled();

    await until(() => sockets.length === 3 && last().sent.length === 1);
    last().reply(3);
    await until(() => sub.subscriptionId === 3);
    expect(onReconnect).toHaveBeenCalledTimes(1);
    client.close();
  });
});

describe("handshake timeout", () => {
  it("rejects a subscribe whose upgrade never answers, without blocking later ones", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    hangNextOpen = 1;
    const hung = client.parsedTransactionSubscribe({ programs: ["A"] });
    const failed = expect(hung).rejects.toThrow(
      "Parsed Streams connection failed"
    );
    await jest.advanceTimersByTimeAsync(15_000);
    await failed;
    expect(sockets[0].readyState).toBe(3); // The hung socket was killed

    await subscribeWith(client, 1);
    expect(sockets).toHaveLength(2);
    client.close();
  });

  it("counts a hung reconnect as a failed attempt and retries", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    hangNextOpen = 1;
    last().serverClose(1001);

    await until(() => sockets.length === 2); // Hangs
    await jest.advanceTimersByTimeAsync(15_000);
    await until(() => sockets.length === 3 && last().readyState === 1);
    await until(() => last().sent.length === 1);
    last().reply(2);
    await until(() => sub.subscriptionId === 2);
    client.close();
  });

  it("ignores an open event that arrives after the timeout", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    hangNextOpen = 1;
    const hung = client.parsedTransactionSubscribe({ programs: ["A"] });
    const failed = expect(hung).rejects.toThrow(
      "Parsed Streams connection failed"
    );
    await jest.advanceTimersByTimeAsync(15_000);
    await failed;

    const late = sockets[0];
    late.readyState = 1;
    late.onopen?.(); // A slow implementation opens after we gave up
    expect(late.sent).toHaveLength(0);

    await subscribeWith(client, 1); // Uses a fresh socket, not the late one
    expect(last()).not.toBe(late);
    client.close();
  });
});

// ── close() ───────────────────────────────────────────────────────────

describe("close", () => {
  it("ends every iterator cleanly and never reconnects", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const sub = await subscribeWith(client, 1);
    const next = sub[Symbol.asyncIterator]().next();

    client.close();
    await expect(next).resolves.toEqual({ value: undefined, done: true });
    await jest.advanceTimersByTimeAsync(60_000);
    expect(sockets).toHaveLength(1);
    await expect(
      client.parsedTransactionSubscribe({ programs: ["A"] })
    ).rejects.toThrow("Parsed Streams client closed");
  });

  it("rejects a subscribe that is still waiting for its response", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.parsedTransactionSubscribe({ programs: ["A"] });
    await until(() => last()?.sent.length === 1);

    client.close();
    await expect(promise).rejects.toThrow("Parsed Streams client closed");
  });

  it("rejects a subscribe whose connection was still opening", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.parsedTransactionSubscribe({ programs: ["A"] });
    client.close(); // Before the socket's open event
    await expect(promise).rejects.toThrow("Parsed Streams client closed");
  });
});

// ── describeProgram ───────────────────────────────────────────────────

describe("describeProgram", () => {
  const description = {
    id: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    name: "jupiter",
    instructions: ["route"],
    events: ["SwapEvent"],
    roles: ["user_transfer_authority"],
  };

  it("queries the discovery endpoint on its own connection", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.describeProgram(description.id);
    await until(() => last()?.sent.length === 1);

    const ws = last();
    expect(ws.url).toBe(`${PARSED_STREAMS_DISCOVERY_URL}KEY`);
    expect(ws.sent[0]).toMatchObject({
      method: "describeProgram",
      params: [{ program: description.id }],
    });
    ws.reply(description);

    await expect(promise).resolves.toEqual(description);
    expect(ws.readyState).toBe(3);
  });

  it("rejects with the JSON-RPC error", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.describeProgram("nope");
    await until(() => last()?.sent.length === 1);
    last().replyError(-32602, "unknown program");
    await expect(promise).rejects.toMatchObject({
      message: "unknown program",
      code: -32602,
    });
  });

  it("times out when the endpoint never answers", async () => {
    const client = makeParsedStreamsClient("KEY", { WebSocket: WS });
    const promise = client.describeProgram("slow");
    const assertion = expect(promise).rejects.toThrow(
      "describeProgram timed out"
    );
    await jest.advanceTimersByTimeAsync(15_000);
    await assertion;
  });

  it("uses custom url and discoveryUrl", async () => {
    const client = makeParsedStreamsClient("KEY", {
      WebSocket: WS,
      url: "wss://custom/stream",
      discoveryUrl: "wss://custom/discover",
    });
    const described = client.describeProgram("x");
    await until(() => last()?.sent.length === 1);
    expect(last().url).toBe("wss://custom/discover");
    last().reply({ id: "x" });
    await described;

    const subscribed = client.parsedTransactionSubscribe({ programs: ["A"] });
    await until(() => sockets.length === 2);
    expect(last().url).toBe("wss://custom/stream");
    client.close();
    await expect(subscribed).rejects.toThrow("Parsed Streams client closed");
  });
});

describe("WebSocket implementation", () => {
  it("uses the global WebSocket by default", async () => {
    globalWs.WebSocket = MockWebSocket;
    try {
      const client = makeParsedStreamsClient("KEY");
      const subscribed = client.parsedTransactionSubscribe({ programs: ["A"] });
      await until(() => sockets.length === 1);
      client.close();
      await expect(subscribed).rejects.toThrow("Parsed Streams client closed");
    } finally {
      delete globalWs.WebSocket;
    }
  });

  it("explains how to supply one when none is available", async () => {
    const saved = globalWs.WebSocket;
    delete globalWs.WebSocket;
    try {
      const client = makeParsedStreamsClient("KEY");
      await expect(
        client.parsedTransactionSubscribe({ programs: ["A"] })
      ).rejects.toThrow(/pass `WebSocket` from the `ws` package/);
      await expect(client.describeProgram("x")).rejects.toThrow(
        /pass `WebSocket` from the `ws` package/
      );
    } finally {
      globalWs.WebSocket = saved;
    }
  });
});
