import type {
  DecodedInstruction,
  ParsedNativeTransfer,
  ParsedSummary,
  ParsedTokenTransfer,
} from "../parsedEvents/types";

/** Gatekeeper endpoint that serves Parsed Streams subscriptions. The API key is appended. */
export const PARSED_STREAMS_URL = "wss://beta.helius-rpc.com/?api-key=";

/** Endpoint that currently serves `describeProgram`. The API key is appended. */
export const PARSED_STREAMS_DISCOVERY_URL =
  "wss://fs-beta.helius-rpc.com/?api-key=";

// ── Filter and options ────────────────────────────────────────────────

/**
 * Which instructions a subscription matches. At least one of `programs` or
 * `accounts.include` is required; the fields you set combine with AND. Take
 * instruction and role names from {@link ParsedStreamsClient.describeProgram}.
 */
export interface ParsedTransactionFilter {
  /** Program IDs (base58 addresses, not names). Max 10. */
  programs?: string[];
  /** Decoded instruction names, e.g. `"route"`. Max 50. */
  instructionNames?: string[];
  accounts?: {
    /** Addresses an instruction must touch (any of). Max 100. */
    include?: string[];
    /** Decoded role name → address, all must hold. Names match exactly. Max 20. */
    roles?: Record<string, string>;
  };
  /** Include instructions from failed transactions. Defaults to `false`. */
  includeFailed?: boolean;
  /** Let inner (CPI) instructions match. Defaults to `true`. */
  includeCpi?: boolean;
}

/**
 * What each notification carries. `full` (default): the whole transaction plus
 * `matchedIndexes`. `matched`: only the matching instructions. `raw`: matching
 * instructions reduced to position, program, and base58 data.
 */
export type ParsedStreamDetails = "full" | "matched" | "raw";

/** Options for {@link ParsedStreamsClient.parsedTransactionSubscribe}. */
export interface ParsedTransactionSubscribeOptions<
  D extends ParsedStreamDetails = ParsedStreamDetails,
> {
  /** Only `confirmed` is supported. */
  commitment?: "confirmed";
  /** Payload size. Defaults to `"full"`. */
  details?: D;
}

// ── Notifications ─────────────────────────────────────────────────────

/** Transaction context in a `full` or `matched` notification. */
export interface ParsedStreamTransaction {
  signature: string;
  slot: number;
  /** Currently always `null`; do not build on it. */
  blockTime: number | null;
  /** Always `accountKeys[0]`. */
  feePayer: string;
  /** Fee in lamports. */
  fee: number;
  /** Every account key, including those loaded from lookup tables, in chain order. */
  accountKeys: string[];
  status: "ok" | "error";
  /** Structured transaction error when `status` is `"error"`, e.g. `{ InstructionError: [2, { Custom: 6001 }] }`. */
  error: unknown;
  /** The transaction's headline action, when recognized. */
  summary: ParsedSummary | null;
  /** SOL movements, same shape as Parsed Events. */
  nativeTransfers: ParsedNativeTransfer[];
  /** Token movements, same shape as Parsed Events. */
  tokenTransfers: ParsedTokenTransfer[];
}

/** An instruction in a `full` or `matched` notification. */
export interface ParsedStreamInstruction {
  /** Top-level instruction this belongs to (from 0). */
  instructionIndex: number;
  /** Position among that instruction's inner calls; `null` for the top-level instruction itself. */
  innerInstructionIndex: number | null;
  /** Call depth (1 for top level). */
  stackHeight: number | null;
  programId: string;
  programName: string | null;
  instructionName: string | null;
  /** Instruction-level summary, when recognized. */
  summary: ParsedSummary | null;
  /** Named args and accounts (snake_case, u64 values as strings), or `null` when undecoded. */
  decoded: DecodedInstruction | null;
  /** Base58 instruction data, present when `decoded` is `null`. */
  rawData?: string;
  /** Plain account list, present when `decoded` is `null`. */
  rawAccounts?: string[];
}

/** Notification payload for `details: "full"` or `"matched"`. */
export interface ParsedTransactionValue {
  transaction: ParsedStreamTransaction;
  /** `full`: every instruction in execution order. `matched`: only the hits. */
  instructions: ParsedStreamInstruction[];
  /** Indexes into `instructions` that matched the filter. Absent with `details: "matched"`. */
  matchedIndexes?: number[];
}

/** Transaction context in a `raw` notification. */
export type RawStreamTransaction = Omit<
  ParsedStreamTransaction,
  "accountKeys" | "nativeTransfers" | "tokenTransfers"
>;

/** A matched instruction in a `raw` notification. */
export interface RawStreamInstruction {
  instructionIndex: number;
  innerInstructionIndex: number | null;
  stackHeight: number | null;
  programId: string;
  /** Instruction data as it appears on chain, base58. */
  data: string;
}

/** Notification payload for `details: "raw"`. */
export interface RawTransactionValue {
  transaction: RawStreamTransaction;
  instructions: RawStreamInstruction[];
}

/** Payload type delivered for a given `details` level. */
export type ParsedStreamValue<D extends ParsedStreamDetails> = D extends "raw"
  ? RawTransactionValue
  : ParsedTransactionValue;

/** One matching transaction. `context.slot` bounds the backfill window across reconnects. */
export interface ParsedTransactionNotification<V = ParsedTransactionValue> {
  context: { slot: number };
  value: V;
}

/**
 * An active subscription. Iterate it with `for await`; it survives reconnects.
 * The iterator ends when you unsubscribe or close the client, and throws if the
 * subscription can't be kept alive (slow consumer, rejected filter on
 * resubscribe, or reconnect attempts exhausted).
 */
export interface ParsedTransactionSubscription<
  V = ParsedTransactionValue,
> extends AsyncIterable<ParsedTransactionNotification<V>> {
  /** Current server-assigned id. Changes after a reconnect. */
  readonly subscriptionId: number | undefined;
  /** Stop the subscription. Resolves `true` if the server confirmed it. */
  unsubscribe(): Promise<boolean>;
}

/** `describeProgram` result: the exact names the matcher compares against. */
export interface ProgramDescription {
  /** Program address (base58). Check it when you looked the program up by name. */
  id: string;
  /** Catalog name. */
  name: string;
  /** Decoded instruction names, for `instructionNames`. */
  instructions: string[];
  /** Event names the parser recognizes. */
  events: string[];
  /** Account role names, for `accounts.roles` keys. */
  roles: string[];
}

/** Passed to `onReconnect` once subscriptions are restored on a new connection. */
export interface ParsedStreamsReconnectInfo {
  /** WebSocket close code that caused the reconnect (e.g. 1000 idle, 1001 deploy, 1006 network). */
  closeCode: number;
  /**
   * Highest `context.slot` delivered before the disconnect, or `undefined` if
   * none was. Transactions after it that confirmed while disconnected were not
   * delivered; backfill them from RPC if you need them.
   */
  lastSlot: number | undefined;
}

/** A JSON-RPC error from Parsed Streams, with its `code` (e.g. -32602 invalid params). */
export type ParsedStreamsError = Error & { code?: number };

/** Options for {@link makeParsedStreamsClient}. */
export interface ParsedStreamsClientOptions {
  /** Override the subscription endpoint (full URL, including the API key). */
  url?: string;
  /** Override the `describeProgram` endpoint (full URL, including the API key). */
  discoveryUrl?: string;
  /** Reconnect and resubscribe when the server closes the connection. Defaults to `true`. */
  reconnect?: boolean;
  /** Consecutive failed reconnect attempts before giving up. Defaults to 10. */
  maxReconnectAttempts?: number;
  /** Called after a reconnect restores the subscriptions. */
  onReconnect?: (info: ParsedStreamsReconnectInfo) => void;
  /**
   * WebSocket implementation. Defaults to the global `WebSocket` (browsers,
   * Node 22+). On Node 20, pass `WebSocket` from the `ws` package, which also
   * lets the client watch the server's pings to detect a dead connection.
   */
  WebSocket?: new (url: string) => unknown;
}

/**
 * Client for Helius **Parsed Streams**.
 *
 * Parsed Streams pushes confirmed transactions that match a server-side filter
 * (program, instruction name, account, account role), already decoded through
 * Helius's IDL catalog. It is the real-time counterpart to Parsed Events and the
 * successor to enhanced transaction webhooks. 1 credit per delivered event.
 *
 * Delivery is **at most once**: the server does not replay what confirmed while
 * a connection was down. This client reconnects and resubscribes automatically
 * when the server closes the connection (idle timeout, deploy, network edge),
 * and reports the last slot it delivered through `onReconnect` so you can
 * backfill the gap from RPC if you need to.
 *
 * @example
 * ```ts
 * import { makeParsedStreamsClient } from "helius-sdk/websockets/parsedStreams";
 *
 * const streams = makeParsedStreamsClient("your-api-key", {
 *   onReconnect: ({ lastSlot }) => console.log("reconnected; backfill after", lastSlot),
 * });
 *
 * const sub = await streams.parsedTransactionSubscribe({
 *   programs: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
 * });
 *
 * for await (const { value } of sub) {
 *   for (const i of value.matchedIndexes ?? []) {
 *     const ix = value.instructions[i];
 *     console.log(value.transaction.signature, ix.instructionName, ix.decoded?.args);
 *   }
 * }
 * ```
 */
export interface ParsedStreamsClient {
  /**
   * Subscribe to decoded transactions matching `filter`. Resolves once the
   * server accepts the filter; rejects with a {@link ParsedStreamsError} if it
   * doesn't (e.g. -32602 for an unknown field or bad pubkey, -32006 for more
   * than 25 subscriptions on one connection).
   */
  parsedTransactionSubscribe<D extends ParsedStreamDetails = "full">(
    filter: ParsedTransactionFilter,
    options?: ParsedTransactionSubscribeOptions<D>
  ): Promise<ParsedTransactionSubscription<ParsedStreamValue<D>>>;
  /** Unsubscribe by current subscription id. */
  parsedTransactionUnsubscribe(subscriptionId: number): Promise<boolean>;
  /**
   * List a program's instruction names, events, and account roles. Pass the
   * program address. A catalog name also works, but names can be ambiguous
   * across program versions, so check `id` in the result. Opens a short-lived
   * connection to the discovery endpoint.
   */
  describeProgram(program: string): Promise<ProgramDescription>;
  /** Close the connection and end every subscription. */
  close(): void;
}

const OPEN = 1;
const MIN_SEND_INTERVAL_MS = 100; // Server allows 10 client messages/s
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
const SLOW_CONSUMER_CODE = 1008; // Client fell >2048 notifications behind
const BUFFER_LIMIT = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;
const LIVENESS_TIMEOUT_MS = 60_000; // Server pings every 15s
const STABLE_CONNECTION_MS = 30_000; // Uptime that resets the reconnect budget
const TRANSIENT_CODES = [-32001, -32002]; // Not ready, rate limited

// Always sets a `code` key, which tells RPC errors from connection errors
const rpcError = (error: {
  code?: number;
  message?: string;
}): ParsedStreamsError =>
  Object.assign(new Error(error.message ?? JSON.stringify(error)), {
    code: error.code,
  });

const isRpcError = (err: unknown): err is ParsedStreamsError =>
  err instanceof Error && "code" in err;

interface IncomingMessage {
  id?: number;
  result?: unknown;
  error?: { code?: number; message?: string };
  method?: string;
  params?: {
    subscription?: number;
    result?: ParsedTransactionNotification<unknown>;
  };
}

const parseMessage = (data: unknown): IncomingMessage | undefined => {
  try {
    return JSON.parse(String(data)) as IncomingMessage;
  } catch {
    return undefined; // Not JSON: ignore
  }
};

const noWebSocket = () =>
  new Error(
    "No WebSocket implementation found. On Node 20, pass `WebSocket` from the `ws` package in the client options."
  );

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

interface Queue<T> {
  push(value: T): void;
  end(err?: Error): void;
  iterator(): AsyncIterator<T>;
}

const makeQueue = <T>(
  onOverflow: () => void,
  onReturn: () => void
): Queue<T> => {
  const buffer: T[] = [];
  let waiting: ((r: IteratorResult<T>) => void) | undefined;
  let rejectWaiting: ((err: Error) => void) | undefined;
  let finished = false;
  let failure: Error | undefined;

  const settle = () => {
    const resolve = waiting;
    const reject = rejectWaiting;
    waiting = rejectWaiting = undefined;
    if (failure && reject) reject(failure);
    else resolve?.({ value: undefined, done: true });
  };

  return {
    push(value) {
      if (finished) return;
      if (waiting) {
        const resolve = waiting;
        waiting = rejectWaiting = undefined;
        resolve({ value, done: false });
      } else if (buffer.length >= BUFFER_LIMIT) {
        onOverflow();
      } else {
        buffer.push(value);
      }
    },
    end(err) {
      if (finished) return;
      finished = true;
      failure = err;
      settle();
    },
    iterator() {
      return {
        next() {
          if (buffer.length) {
            return Promise.resolve({ value: buffer.shift()!, done: false });
          }
          if (finished) {
            return failure
              ? Promise.reject(failure)
              : Promise.resolve({ value: undefined, done: true });
          }
          return new Promise<IteratorResult<T>>((resolve, reject) => {
            waiting = resolve;
            rejectWaiting = reject;
          });
        },
        // Leaving `for await` early stops the subscription
        return() {
          finished = true;
          buffer.length = 0;
          onReturn();
          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };
};

interface SubState {
  params: unknown[];
  serverId: number | undefined;
  /** False once unsubscribed or failed, so a late subscribe ack is cancelled. */
  active: boolean;
  queue: Queue<ParsedTransactionNotification<unknown>>;
}

/** The parts of a `ws`-package socket used for liveness, when present. */
interface PingAware {
  on?: (event: "ping", listener: () => void) => void;
  terminate?: () => void;
}

/** Create a {@link ParsedStreamsClient} for an API key. Connects on the first subscription. */
export const makeParsedStreamsClient = (
  apiKey: string,
  options: ParsedStreamsClientOptions = {}
): ParsedStreamsClient => {
  const {
    url = `${PARSED_STREAMS_URL}${apiKey}`,
    discoveryUrl = `${PARSED_STREAMS_DISCOVERY_URL}${apiKey}`,
    reconnect = true,
    maxReconnectAttempts = 10,
    onReconnect,
  } = options;
  const WS = (options.WebSocket ?? globalThis.WebSocket) as
    | (new (url: string) => WebSocket)
    | undefined;

  let ws: WebSocket | undefined;
  let connecting: Promise<WebSocket> | undefined;
  let closed = false;
  let nextId = 1;
  let lastSlot: number | undefined;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let stableTimer: ReturnType<typeof setTimeout> | undefined;
  let outage: { closeCode: number; lastSlot: number | undefined } | undefined;
  let sendGate: Promise<void> = Promise.resolve();
  let lastSendAt = 0;

  const pending = new Map<number, Pending>();
  const subs = new Set<SubState>();
  const byServerId = new Map<number, SubState>();

  const failAll = (err?: Error) => {
    // The next subscription starts with a full budget
    attempts = 0;
    outage = undefined;
    for (const sub of subs) {
      sub.active = false;
      sub.queue.end(err);
    }
    subs.clear();
    byServerId.clear();
  };

  const handleClose = (code: number) => {
    clearTimeout(stableTimer);
    ws = undefined;
    connecting = undefined;
    const err = new Error(`Parsed Streams connection closed (code ${code})`);
    for (const [, req] of pending) req.reject(err);
    pending.clear();
    byServerId.clear();
    for (const sub of subs) sub.serverId = undefined;

    if (closed || !subs.size) return;
    if (code === SLOW_CONSUMER_CODE) {
      failAll(
        new Error(
          `Parsed Streams closed the connection because this client fell more than 2048 notifications behind (code 1008). Narrow the filter, use details: "matched" or "raw", or process notifications faster.`
        )
      );
      return;
    }
    if (!reconnect) {
      failAll(err);
      return;
    }
    // The first close of an outage marks where the gap starts
    outage ??= { closeCode: code, lastSlot };
    if (++attempts > maxReconnectAttempts) {
      failAll(
        new Error(
          `Parsed Streams gave up after ${maxReconnectAttempts} reconnect attempts (last close code ${code})`
        )
      );
      return;
    }
    const delay = Math.min(
      BACKOFF_BASE_MS * 2 ** (attempts - 1),
      BACKOFF_MAX_MS
    );
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      void restore();
    }, delay);
  };

  const handleMessage = (data: unknown) => {
    const msg = parseMessage(data);
    if (!msg) return;
    if (msg.method === "parsedTransactionNotification") {
      const { subscription, result } = msg.params ?? {};
      const sub =
        subscription === undefined ? undefined : byServerId.get(subscription);
      if (!sub || !result) return;
      const slot = result.context?.slot;
      if (
        typeof slot === "number" &&
        (lastSlot === undefined || slot > lastSlot)
      ) {
        lastSlot = slot;
      }
      attempts = 0; // Delivering: the connection works
      sub.queue.push(result);
      return;
    }
    if (msg.id === undefined) return;
    const req = pending.get(msg.id);
    if (!req) return;
    pending.delete(msg.id);
    if (msg.error) req.reject(rpcError(msg.error));
    else req.resolve(msg.result);
  };

  const kill = (socket: WebSocket) => {
    const { terminate } = socket as PingAware;
    if (terminate) terminate.call(socket);
    else socket.close();
  };

  const connect = (): Promise<WebSocket> => {
    if (ws?.readyState === OPEN) return Promise.resolve(ws);
    if (connecting) return connecting;
    if (closed)
      return Promise.reject(new Error("Parsed Streams client closed"));
    if (!WS) return Promise.reject(noWebSocket());

    let socket: WebSocket;
    try {
      socket = new WS(url);
    } catch (err) {
      // e.g. a malformed url: count it as a failed attempt
      handleClose(1006);
      return Promise.reject(err);
    }

    connecting = new Promise<WebSocket>((resolve, reject) => {
      let opened = false;
      let done = false;
      let lastSeen = Date.now();
      let watchdog: ReturnType<typeof setInterval> | undefined;
      // An upgrade that never answers would stall everything behind it
      const handshake = setTimeout(() => {
        finish(1006);
        kill(socket);
      }, REQUEST_TIMEOUT_MS);

      const finish = (code: number) => {
        if (done) return;
        done = true;
        clearTimeout(handshake);
        if (watchdog) clearInterval(watchdog);
        if (!opened) reject(new Error("Parsed Streams connection failed"));
        handleClose(code);
      };

      socket.onopen = () => {
        if (done) return; // Timed out already
        clearTimeout(handshake);
        opened = true;
        if (closed) {
          reject(new Error("Parsed Streams client closed"));
          socket.close();
          return;
        }
        // Only `ws` sockets expose server pings; elsewhere rely on close events
        const { on } = socket as PingAware;
        if (on) {
          on.call(socket, "ping", () => (lastSeen = Date.now()));
          watchdog = setInterval(() => {
            if (Date.now() - lastSeen > LIVENESS_TIMEOUT_MS) kill(socket);
          }, LIVENESS_TIMEOUT_MS / 4);
        }
        ws = socket;
        resolve(socket);
      };
      socket.onerror = () => {
        if (!opened) finish(1006);
      };
      socket.onclose = (event?: CloseEvent) => finish(event?.code ?? 1006);
      socket.onmessage = (event: MessageEvent) => {
        lastSeen = Date.now();
        handleMessage(event.data);
      };
    });
    return connecting;
  };

  const send = (socket: WebSocket, payload: string): Promise<void> => {
    const sent = sendGate.then(async () => {
      const wait = lastSendAt + MIN_SEND_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      // It may have closed while this send waited its turn
      if (socket.readyState !== OPEN) {
        throw new Error(
          closed
            ? "Parsed Streams client closed"
            : "Parsed Streams connection closed"
        );
      }
      lastSendAt = Date.now();
      socket.send(payload);
    });
    // A failed send must not block later ones
    sendGate = sent.catch(() => undefined);
    return sent;
  };

  const request = async (method: string, params: unknown[]) => {
    const socket = await connect();
    const id = nextId++;
    await send(socket, JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    // Registered after the send with no await between: nothing can run first,
    // and an unsent request leaves no promise for handleClose to reject unobserved
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Parsed Streams ${method} timed out`));
        kill(socket); // No answer: treat the connection as dead
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  };

  const subscribe = async (sub: SubState) => {
    const id = (await request(
      "parsedTransactionSubscribe",
      sub.params
    )) as number;
    // Closed before this ack was applied: the id is dead
    if (!ws) throw new Error("Parsed Streams connection closed");
    if (!sub.active) {
      // Unsubscribed while the ack was in flight: cancel it
      request("parsedTransactionUnsubscribe", [id]).catch(() => undefined);
      return;
    }
    sub.serverId = id;
    byServerId.set(id, sub);
  };

  const restore = async () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    if (closed || !subs.size) return;
    try {
      await connect();
      for (const sub of subs) {
        if (sub.serverId !== undefined || !sub.active) continue;
        try {
          await subscribe(sub);
        } catch (err) {
          if (!isRpcError(err)) throw err; // Connection dropped: handleClose retries
          const { code } = err;
          if (code === undefined || TRANSIENT_CODES.includes(code)) {
            if (ws) kill(ws); // Retry the whole reconnect with backoff
            return;
          }
          // Filter now rejected: fail just this subscription
          subs.delete(sub);
          sub.active = false;
          sub.queue.end(err);
        }
      }
    } catch {
      return; // handleClose has already scheduled the next attempt
    }
    // Reset only once stable, so accept-then-close still exhausts attempts
    stableTimer = setTimeout(() => (attempts = 0), STABLE_CONNECTION_MS);
    const info = outage;
    outage = undefined;
    if (info && onReconnect) {
      try {
        onReconnect(info);
      } catch {
        // A throwing callback must not break the stream
      }
    }
  };

  const unsubscribeSub = async (sub: SubState): Promise<boolean> => {
    sub.active = false;
    subs.delete(sub);
    sub.queue.end();
    const id = sub.serverId;
    if (id === undefined || ws?.readyState !== OPEN) return false;
    byServerId.delete(id);
    try {
      return (await request("parsedTransactionUnsubscribe", [id])) === true;
    } catch {
      return false;
    }
  };

  return {
    async parsedTransactionSubscribe<D extends ParsedStreamDetails = "full">(
      filter: ParsedTransactionFilter,
      subscribeOptions?: ParsedTransactionSubscribeOptions<D>
    ) {
      if (closed) throw new Error("Parsed Streams client closed");
      // Mid-backoff: restore existing subscriptions on the new connection now
      if (reconnectTimer) void restore();
      const sub: SubState = {
        params: subscribeOptions ? [filter, subscribeOptions] : [filter],
        serverId: undefined,
        active: true,
        queue: makeQueue(
          // Consumer stopped reading: fail loudly rather than drop data. End
          // with the error first so unsubscribing can't end it cleanly.
          () => {
            sub.queue.end(
              new Error(
                `Parsed Streams subscription buffered ${BUFFER_LIMIT} unread notifications; the consumer is too slow`
              )
            );
            void unsubscribeSub(sub);
          },
          () => void unsubscribeSub(sub)
        ),
      };
      await subscribe(sub);
      subs.add(sub);

      const handle = {
        get subscriptionId() {
          return sub.serverId;
        },
        unsubscribe: () => unsubscribeSub(sub),
        [Symbol.asyncIterator]: () => sub.queue.iterator(),
      };
      return handle as ParsedTransactionSubscription<ParsedStreamValue<D>>;
    },

    async parsedTransactionUnsubscribe(subscriptionId) {
      const sub = byServerId.get(subscriptionId);
      return sub ? unsubscribeSub(sub) : false;
    },

    describeProgram(program) {
      if (!WS) return Promise.reject(noWebSocket());
      return new Promise<ProgramDescription>((resolve, reject) => {
        let socket: WebSocket;
        try {
          socket = new WS(discoveryUrl);
        } catch (err) {
          reject(err);
          return;
        }
        let done = false;
        const finish = (err?: Error, result?: ProgramDescription) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          socket.close();
          if (err) reject(err);
          else resolve(result!);
        };
        const timer = setTimeout(
          () => finish(new Error("describeProgram timed out")),
          REQUEST_TIMEOUT_MS
        );
        socket.onopen = () =>
          socket.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "describeProgram",
              params: [{ program }],
            })
          );
        socket.onmessage = (event: MessageEvent) => {
          const msg = parseMessage(event.data);
          if (msg?.id !== 1) return;
          if (msg.error) finish(rpcError(msg.error));
          else finish(undefined, msg.result as ProgramDescription);
        };
        socket.onerror = () =>
          finish(new Error("describeProgram connection failed"));
        socket.onclose = () =>
          finish(
            new Error("describeProgram connection closed before a response")
          );
      });
    },

    close() {
      closed = true;
      clearTimeout(stableTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      const socket = ws;
      failAll();
      for (const [, req] of pending) {
        req.reject(new Error("Parsed Streams client closed"));
      }
      pending.clear();
      ws = undefined;
      connecting = undefined;
      socket?.close();
    },
  };
};
