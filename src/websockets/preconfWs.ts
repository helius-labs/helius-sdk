import { getTransactionDecoder, type Transaction } from "@solana/kit";

/**
 * Helius **Pre Confirmations** (`preconfSubscribe`) WebSocket client.
 *
 * Pre Confirmations are Helius's lowest-latency transaction stream: scheduled
 * transactions are delivered over WebSocket **before** they are shredded.
 *
 * > A pre-confirmation is an **early signal, not a guarantee** — a streamed
 * > transaction may still fail to land.
 *
 * Coverage is **not continuous**: the stream scales with the share of stake
 * forwarding scheduled transactions to Helius, so expect gaps — not every slot
 * or transaction will appear.
 *
 * Pricing is **credit-based** (10 credits per notification message), the same
 * model as other Helius WebSocket subscriptions. It is **not** tip-based.
 *
 * ## Wire format
 *
 * - `preconfSubscribe` takes **no parameters** and streams *all* scheduled
 *   transactions. The subscribe/unsubscribe responses are JSON-RPC 2.0 text
 *   frames (`result` = numeric subscription id / boolean).
 * - Notifications arrive as **binary** frames (little-endian) laid out as:
 *
 *   ```text
 *   version:u8 (1) | slot:u64_le (8) | transaction_index:u64_le (8) | status:u8 (1) | bincode(VersionedTransaction)
 *   ```
 *
 *   The leading `version` byte is read and checked **first** (currently `1`); a
 *   frame carrying an unknown version is dropped rather than misparsed. `status`
 *   is `0 = failed`, `1 = success`, `2 = unknown`.
 */

/**
 * Base WebSocket URL for the Helius Pre Confirmations endpoint.
 *
 * Pre Confirmations are served from the Gatekeeper endpoint
 * (`wss://beta.helius-rpc.com`). Despite the `beta` host name this is **not** a
 * beta product — it is where Pre Confirmations launch during the Gatekeeper
 * migration. The API key is appended as a query parameter.
 */
export const PRECONF_WEBSOCKET_URL = "wss://beta.helius-rpc.com/?api-key=";

/** The wire schema version this client understands. Frames carrying any other
 * version in byte 0 are dropped rather than misparsed. */
export const PRECONF_WIRE_VERSION = 1;

/** Header length before the bincode payload: `version(1) + slot(8) + transaction_index(8) + status(1)`. */
const HEADER_LEN = 18;

/**
 * Landed status of a pre-confirmed transaction.
 *
 * A pre-confirmation is an early signal; `status` reflects the scheduler's
 * current view and may still change before the transaction is finalized.
 *
 * Implemented as a `const` object (not a TS `enum`) so it tree-shakes cleanly.
 */
export const PreconfStatus = {
  Failed: 0,
  Success: 1,
  Unknown: 2,
} as const;

/** The landed status of a pre-confirmed transaction (see {@link PreconfStatus}). */
export type PreconfStatus = (typeof PreconfStatus)[keyof typeof PreconfStatus];

/** Decode the on-the-wire `status` byte; any out-of-range value maps to `Unknown`. */
const decodeStatus = (byte: number): PreconfStatus => {
  switch (byte) {
    case 0:
      return PreconfStatus.Failed;
    case 1:
      return PreconfStatus.Success;
    default:
      return PreconfStatus.Unknown;
  }
};

/** Keepalive ping interval in milliseconds. */
const KEEPALIVE_INTERVAL_MS = 30_000;

/** Maximum buffered notifications before the oldest are dropped. */
const BUFFER_LIMIT = 10_000;

/**
 * A single decoded Pre Confirmations notification.
 *
 * A pre-confirmation is an **early signal, not a guarantee**.
 */
export interface PreconfNotification {
  /** The wire schema version (byte 0). Currently always {@link PRECONF_WIRE_VERSION}. */
  version: number;
  /** The slot the scheduled transaction targets. */
  slot: bigint;
  /** The transaction's index within the scheduled batch for that slot. */
  transactionIndex: bigint;
  /** The reported landed status of the transaction. */
  status: PreconfStatus;
  /**
   * The decoded transaction (the `@solana/kit` {@link Transaction}, i.e.
   * `{ messageBytes, signatures }`), deserialized from the bincode
   * `VersionedTransaction` payload.
   */
  transaction: Transaction;
  /** The raw `bincode(VersionedTransaction)` bytes, exposed alongside the decoded form. */
  transactionBytes: Uint8Array;
}

/**
 * An active Pre Confirmations subscription. Implements `AsyncIterable` for
 * consuming notifications and provides `unsubscribe()` to clean up.
 */
export interface PreconfSubscription extends AsyncIterable<PreconfNotification> {
  /** The server-assigned subscription ID. */
  subscriptionId: number;
  /** Send a `preconfUnsubscribe` and stop receiving notifications. */
  unsubscribe(): Promise<boolean>;
}

/** Client for Helius Pre Confirmations subscriptions. */
export interface PreconfWsClient {
  /**
   * Subscribe to Pre Confirmations. Takes no filter parameters — streams **all**
   * scheduled transactions.
   */
  preconfSubscribe(): Promise<PreconfSubscription>;
  /** Unsubscribe by server-assigned subscription ID. */
  preconfUnsubscribe(subscriptionId: number): Promise<boolean>;
  /** Manually close the underlying WebSocket. */
  close(): void;
}

/**
 * Lazily-constructed `VersionedTransaction` decoder.
 *
 * Built on first use (not at module load) so this module stays free of
 * top-level side effects and remains tree-shakeable.
 */
let txDecoder: ReturnType<typeof getTransactionDecoder> | undefined;
const getTxDecoder = (): ReturnType<typeof getTransactionDecoder> => {
  if (!txDecoder) {
    txDecoder = getTransactionDecoder();
  }
  return txDecoder;
};

/**
 * Decode a raw Pre Confirmations binary frame into a {@link PreconfNotification}.
 *
 * Layout: `version:u8 | slot:u64_le | transaction_index:u64_le | status:u8 | bincode(VersionedTransaction)`.
 *
 * The leading `version` byte is checked first; a frame with an unrecognized
 * version throws so future format changes fail loudly instead of being silently
 * misparsed.
 *
 * @throws if the frame is shorter than the 18-byte header (+ at least 1 payload
 *   byte), the version is unknown, or the transaction payload fails to decode.
 */
export const decodePreconfFrame = (bytes: Uint8Array): PreconfNotification => {
  if (bytes.length < HEADER_LEN + 1) {
    throw new Error(
      `preconf frame too short: ${bytes.length} bytes (need > ${HEADER_LEN})`
    );
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = view.getUint8(0);
  if (version !== PRECONF_WIRE_VERSION) {
    throw new Error(
      `unsupported preconf wire version ${version} (this client understands ${PRECONF_WIRE_VERSION})`
    );
  }
  const slot = view.getBigUint64(1, true);
  const transactionIndex = view.getBigUint64(9, true);
  const status = decodeStatus(view.getUint8(17));
  const transactionBytes = bytes.slice(HEADER_LEN);
  const transaction = getTxDecoder().decode(transactionBytes);

  return {
    version,
    slot,
    transactionIndex,
    status,
    transaction,
    transactionBytes,
  };
};

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

interface NotificationSink {
  push: (value: PreconfNotification) => void;
  done: () => void;
  error: (err: Error) => void;
}

const toUint8Array = (data: unknown): Uint8Array | undefined => {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return undefined;
};

/**
 * Create a Pre Confirmations WebSocket client connected to the given URL.
 *
 * The URL should be the Pre Confirmations endpoint with an API key. Pre
 * Confirmations are served from the Gatekeeper endpoint
 * (`wss://beta.helius-rpc.com/?api-key=<KEY>`); see {@link PRECONF_WEBSOCKET_URL}.
 * For the common case, prefer {@link makePreconfWsClientForApiKey}.
 */
export const makePreconfWsClient = (preconfWsUrl: string): PreconfWsClient => {
  let ws: WebSocket | undefined;
  let connecting: Promise<WebSocket> | undefined;
  let closed = false;
  let nextId = 1;
  let keepaliveTimer: ReturnType<typeof setInterval> | undefined;

  const pendingRequests = new Map<number, PendingRequest>();
  // preconfSubscribe supports a single stream per connection; the server assigns
  // an incrementing id. We forward every binary notification to all active sinks.
  const sinks = new Set<NotificationSink>();

  const cleanup = (reason?: Error) => {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = undefined;
    }
    for (const [, req] of pendingRequests) {
      req.reject(
        reason ?? new Error("Pre Confirmations WebSocket client closed")
      );
    }
    pendingRequests.clear();
    for (const sink of sinks) {
      if (reason) sink.error(reason);
      else sink.done();
    }
    sinks.clear();
    ws = undefined;
    connecting = undefined;
  };

  const handleText = (data: string) => {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return; // Malformed JSON — ignore
    }
    if (msg.id != null && msg.id !== 0) {
      const pending = pendingRequests.get(msg.id);
      if (pending) {
        pendingRequests.delete(msg.id);
        if (msg.error) {
          pending.reject(
            new Error(msg.error.message ?? JSON.stringify(msg.error))
          );
        } else {
          pending.resolve(msg.result);
        }
      }
    }
  };

  const handleBinary = (bytes: Uint8Array) => {
    let notif: PreconfNotification;
    try {
      notif = decodePreconfFrame(bytes);
    } catch {
      // Malformed or unknown-version frame — skip rather than tear down the stream.
      return;
    }
    for (const sink of sinks) sink.push(notif);
  };

  const connect = (): Promise<WebSocket> => {
    if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws);
    if (connecting) return connecting;

    connecting = new Promise<WebSocket>((resolve, reject) => {
      if (closed) {
        reject(new Error("Pre Confirmations WebSocket client closed"));
        return;
      }

      const socket = new WebSocket(preconfWsUrl);
      // Ensure binary frames arrive as ArrayBuffer in browsers (Node `ws`
      // delivers Buffer regardless).
      try {
        (socket as any).binaryType = "arraybuffer";
      } catch {
        // Ignore — not all environments expose binaryType.
      }

      socket.onopen = () => {
        if (closed) {
          socket.close();
          reject(new Error("Pre Confirmations WebSocket client closed"));
          return;
        }
        ws = socket;

        keepaliveTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              if (typeof (ws as any).ping === "function") {
                (ws as any).ping();
              }
            } catch {
              // Ignore keepalive errors.
            }
          }
        }, KEEPALIVE_INTERVAL_MS);

        resolve(socket);
      };

      socket.onerror = () => {
        const err = new Error("Pre Confirmations WebSocket connection error");
        cleanup(err);
        reject(err);
      };

      socket.onclose = () => {
        cleanup(
          new Error(
            "Pre Confirmations WebSocket connection closed unexpectedly"
          )
        );
      };

      socket.onmessage = (event: MessageEvent) => {
        const { data } = event;
        if (typeof data === "string") {
          handleText(data);
          return;
        }
        const bytes = toUint8Array(data);
        if (bytes) handleBinary(bytes);
      };
    });

    return connecting;
  };

  const sendRequest = async (method: string): Promise<unknown> => {
    const socket = await connect();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      // preconfSubscribe / preconfUnsubscribe take no params.
      socket.send(JSON.stringify({ jsonrpc: "2.0", id, method }));
    });
  };

  const makePushQueue = (): {
    sink: NotificationSink;
    iterable: AsyncIterable<PreconfNotification>;
  } => {
    const buffer: PreconfNotification[] = [];
    let waiting:
      | ((value: IteratorResult<PreconfNotification>) => void)
      | undefined;
    let finished = false;
    let iteratorError: Error | undefined;

    const sink: NotificationSink = {
      push(value) {
        if (finished) return;
        if (waiting) {
          const resolve = waiting;
          waiting = undefined;
          resolve({ value, done: false });
        } else {
          if (buffer.length >= BUFFER_LIMIT) buffer.shift();
          buffer.push(value);
        }
      },
      done() {
        finished = true;
        if (waiting) {
          const resolve = waiting;
          waiting = undefined;
          resolve({ value: undefined as any, done: true });
        }
      },
      error(err) {
        iteratorError = err;
        finished = true;
        if (waiting) {
          const resolve = waiting;
          waiting = undefined;
          resolve({ value: undefined as any, done: true });
        }
      },
    };

    const iterable: AsyncIterable<PreconfNotification> = {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<PreconfNotification>> {
            if (buffer.length > 0) {
              return Promise.resolve({ value: buffer.shift()!, done: false });
            }
            if (finished) {
              if (iteratorError) return Promise.reject(iteratorError);
              return Promise.resolve({ value: undefined as any, done: true });
            }
            return new Promise((resolve) => {
              waiting = resolve;
            });
          },
          return(): Promise<IteratorResult<PreconfNotification>> {
            finished = true;
            buffer.length = 0;
            return Promise.resolve({ value: undefined as any, done: true });
          },
        };
      },
    };

    return { sink, iterable };
  };

  return {
    async preconfSubscribe(): Promise<PreconfSubscription> {
      if (closed) throw new Error("Pre Confirmations WebSocket client closed");

      const subscriptionId = (await sendRequest("preconfSubscribe")) as number;
      const { sink, iterable } = makePushQueue();
      sinks.add(sink);

      const sub: PreconfSubscription = {
        subscriptionId,
        async unsubscribe(): Promise<boolean> {
          sinks.delete(sink);
          sink.done();
          try {
            return (await sendRequest("preconfUnsubscribe")) as boolean;
          } catch {
            return false;
          }
        },
        [Symbol.asyncIterator]() {
          return iterable[Symbol.asyncIterator]();
        },
      };

      return sub;
    },

    async preconfUnsubscribe(): Promise<boolean> {
      // Connection-scoped subscription: drop all sinks and tell the server.
      for (const sink of sinks) sink.done();
      sinks.clear();
      try {
        return (await sendRequest("preconfUnsubscribe")) as boolean;
      } catch {
        return false;
      }
    },

    close() {
      closed = true;
      const socket = ws;
      cleanup();
      if (socket) socket.close();
    },
  };
};

/**
 * Convenience constructor: create a Pre Confirmations client for an API key
 * using the Gatekeeper endpoint ({@link PRECONF_WEBSOCKET_URL}).
 */
export const makePreconfWsClientForApiKey = (apiKey: string): PreconfWsClient =>
  makePreconfWsClient(`${PRECONF_WEBSOCKET_URL}${apiKey}`);
