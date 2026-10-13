import { getTransactionDecoder, type Transaction } from "@solana/kit";
import { getSDKHeaders } from "../http";

/** Pre Confirmations endpoint (Gatekeeper; `beta` names the host, not the product's status). Append the API key. */
export const PRECONF_WEBSOCKET_URL = "wss://beta.helius-rpc.com/?api-key=";

/** Frame schema version this client decodes; other versions are dropped. */
export const PRECONF_WIRE_VERSION = 1;

// version(1) + slot(8) + transaction_index(8) + status(1)
const HEADER_LEN = 18;

/** Landed status of a pre-confirmed transaction: an early signal that may still change. */
export const PreconfStatus = {
  Failed: 0,
  Success: 1,
  Unknown: 2,
} as const;

/** The landed status of a pre-confirmed transaction (see {@link PreconfStatus}). */
export type PreconfStatus = (typeof PreconfStatus)[keyof typeof PreconfStatus];

// Out-of-range bytes map to Unknown
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

const KEEPALIVE_INTERVAL_MS = 30_000;

// Buffered notifications before the oldest are dropped
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
  /**
   * The transaction's index within the scheduled batch for that slot. Always
   * `0` for BAM preconfirmations, so it doesn't identify the source.
   */
  transactionIndex: bigint;
  /** The reported landed status of the transaction. */
  status: PreconfStatus;
  /**
   * The decoded transaction (the `@solana/kit` {@link Transaction}, i.e.
   * `{ messageBytes, signatures }`), decoded from the wire-format payload
   * (legacy, v0, or v1).
   */
  transaction: Transaction;
  /** The raw transaction bytes (Solana wire format), exposed alongside the decoded form. */
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

/**
 * Region where a preconfirmation originated: where Helius ingested it, or the
 * regional BAM endpoint that emitted it.
 */
export type PreconfRegion =
  | "slc"
  | "fra"
  | "lon"
  | "pit"
  | "sgp"
  | "ewr"
  | "iad"
  | "hkg"
  | "tyo"
  | "ams"
  | "dal"
  | "dub"
  | "mia"
  | "lax"
  | "sea"
  | "sqq"
  // Regions added server-side work without waiting for an SDK release
  | (string & {});

/** Matches a top-level instruction (not CPIs) by program and data. */
export interface PreconfInstructionFilter {
  /** Program invoked by the instruction (base58). */
  programId: string;
  /** All must match. Max 4. */
  memcmp?: readonly {
    /** Byte offset into the instruction data. */
    offset: number;
    /** 1–128 bytes once decoded. */
    bytes: string;
    /** Defaults to `base58`. */
    encoding?: "base58" | "base64" | "hex";
  }[];
  /** Exact instruction data length in bytes (max 4,096). */
  dataSize?: number;
}

/**
 * Server-side filter for {@link PreconfWsClient.preconfSubscribe}. Every field
 * is optional; set fields combine with AND. Account filters also match
 * accounts loaded through address lookup tables.
 */
export interface PreconfFilter {
  /** `false` drops BAM preconfirmations (Helius only). Defaults to `true`. */
  includeBam?: boolean;
  /** `true`: only failed transactions; `false`: only successful. Either excludes unknown-status Helius transactions. */
  failed?: boolean;
  /** Only transactions from one of these regions; ones without a region are dropped. */
  regionInclude?: readonly PreconfRegion[];
  /** Must reference at least one of these accounts. Max 10,000. */
  accountInclude?: readonly string[];
  /** Dropped if it references any of these. Takes precedence over `accountInclude`. Max 10,000. */
  accountExclude?: readonly string[];
  /** Must reference all of these accounts. Max 10,000. */
  accountRequired?: readonly string[];
  /** Must be signed by at least one of these accounts. Max 10,000. */
  signerInclude?: readonly string[];
  /** Dropped if signed by any of these. Takes precedence over `signerInclude`. Max 10,000. */
  signerExclude?: readonly string[];
  /** First signature must match one of these. Max 1,000. */
  signatures?: readonly string[];
  /** At least one top-level instruction must match one of these. Max 16. */
  instructions?: readonly PreconfInstructionFilter[];
}

/** Options for {@link makePreconfWsClient} and {@link makePreconfWsClientForApiKey}. */
export interface PreconfWsClientOptions {
  /**
   * WebSocket implementation. Defaults to the global `WebSocket` (browsers,
   * Node 22+). On Node 20, pass `WebSocket` from the `ws` package, which also
   * enables protocol-level keepalive pings.
   */
  WebSocket?: new (url: string) => unknown;
}

/** A JSON-RPC error from Pre Confirmations, with its `code` (e.g. -32602 invalid params). */
export type PreconfError = Error & { code?: number };

/** `getPreConfCoverage` result. Coverage is by stake, for both sources, regardless of filters. */
export interface PreconfCoverage {
  /** Percentage of total network stake covered by Helius and BAM (e.g. `45.84`). */
  networkSharePercent: number;
  /** Share of covered stake per region (e.g. `{ fra: 0.27 }`). */
  coverageByRegion: Partial<Record<PreconfRegion, number>>;
}

/**
 * Client for Helius **Pre Confirmations** (`preconfSubscribe`).
 *
 * Pre Confirmations are Helius's lowest-latency transaction stream: scheduled
 * transactions are delivered over WebSocket **before** they are shredded.
 *
 * > A pre-confirmation is an **early signal, not a guarantee** — a streamed
 * > transaction may still fail to land.
 *
 * Coverage is **not continuous**: it scales with the share of stake covered by
 * the two sources (validators forwarding to Helius, and BAM validators), so
 * expect gaps — not every slot or transaction will appear. See
 * {@link PreconfWsClient.getPreConfCoverage}.
 *
 * Pricing is per message with a per-slot minimum for each open subscription, so
 * filter server-side and unsubscribe streams you no longer need. See
 * https://www.helius.dev/docs/pre-confirmations/overview#pricing.
 *
 * ## Wire format
 *
 * - `preconfSubscribe` takes an optional {@link PreconfFilter}, applied
 *   server-side; omit it to stream every transaction from Helius and BAM. The
 *   subscribe/unsubscribe responses are JSON-RPC 2.0 text frames (`result` =
 *   numeric subscription id / boolean).
 * - Notifications arrive as **binary** frames (little-endian) laid out as:
 *
 *   ```text
 *   version:u8 (1) | slot:u64_le (8) | transaction_index:u64_le (8) | status:u8 (1) | transaction
 *   ```
 *
 *   The leading `version` byte is read and checked **first** (currently `1`); a
 *   frame carrying an unknown version is dropped rather than misparsed. `status`
 *   is `0 = failed`, `1 = success`, `2 = unknown`.
 */
export interface PreconfWsClient {
  /**
   * Subscribe to Pre Confirmations, optionally filtered server-side. Omit the
   * filter to stream every transaction from Helius and BAM. Each subscription
   * gets its own connection, because notification frames don't say which
   * subscription they belong to. Rejects with the server's error for an
   * invalid filter (JSON-RPC -32602).
   */
  preconfSubscribe(filter?: PreconfFilter): Promise<PreconfSubscription>;
  /**
   * Unsubscribe the live subscription with this server-assigned ID by closing
   * its connection, which removes it server-side. Resolves `true` if it was
   * live, `false` when none has it. Each subscription has its own connection, so
   * prefer `unsubscribe()` on the subscription, which always targets it; as a
   * safety net this throws if several live subscriptions report the same id.
   */
  preconfUnsubscribe(subscriptionId: number): Promise<boolean>;
  /**
   * Current coverage: share of network stake and its regional distribution.
   * Sent over HTTPS to the same host as the subscriptions.
   */
  getPreConfCoverage(): Promise<PreconfCoverage>;
  /** Close every connection and end every subscription. */
  close(): void;
}

// Built on first use so the module has no top-level side effects
let txDecoder: ReturnType<typeof getTransactionDecoder> | undefined;
const getTxDecoder = (): ReturnType<typeof getTransactionDecoder> => {
  if (!txDecoder) {
    txDecoder = getTransactionDecoder();
  }
  return txDecoder;
};

/**
 * Decode a binary frame: `version:u8 | slot:u64_le | transaction_index:u64_le |
 * status:u8 | transaction` (Solana wire format: legacy, v0, or v1).
 *
 * @throws on a short frame, an unknown version, or an undecodable transaction
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

interface NotificationSink {
  push: (value: PreconfNotification) => void;
  /** End cleanly; `drop` discards buffered notifications (unsubscribe/close). */
  done: (drop?: boolean) => void;
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

const makePushQueue = (
  onReturn: () => void
): {
  sink: NotificationSink;
  iterable: AsyncIterable<PreconfNotification>;
} => {
  const buffer: PreconfNotification[] = [];
  // One per pending next(), so concurrent consumers all settle
  const waiters: {
    resolve: (value: IteratorResult<PreconfNotification>) => void;
    reject: (err: Error) => void;
  }[] = [];
  let finished = false;
  let iteratorError: Error | undefined;

  const end = () => {
    finished = true;
    for (const w of waiters.splice(0)) {
      if (iteratorError) w.reject(iteratorError);
      else w.resolve({ value: undefined, done: true });
    }
  };

  const sink: NotificationSink = {
    push(value) {
      if (finished) return;
      const waiter = waiters.shift();
      if (waiter) waiter.resolve({ value, done: false });
      else {
        if (buffer.length >= BUFFER_LIMIT) buffer.shift();
        buffer.push(value);
      }
    },
    done(drop) {
      if (drop) buffer.length = 0;
      end();
    },
    // A parked next() must see the failure, not a normal end
    error(err) {
      if (finished) return;
      iteratorError = err;
      end();
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
            return Promise.resolve({ value: undefined, done: true });
          }
          return new Promise((resolve, reject) => {
            waiters.push({ resolve, reject });
          });
        },
        // Leaving `for await` early unsubscribes (open subscriptions bill)
        return(): Promise<IteratorResult<PreconfNotification>> {
          buffer.length = 0;
          end();
          onReturn();
          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };

  return { sink, iterable };
};

const rpcError = (error: { code?: number; message?: string }): PreconfError =>
  Object.assign(new Error(error.message ?? JSON.stringify(error)), {
    code: error.code,
  });

const SUBSCRIBE_ID = 1;
// Subscribe deadline, handshake included
const ACK_TIMEOUT_MS = 10_000;

/** One subscription on its own socket; frames carry no subscription id. */
interface Stream {
  /** Server-assigned id, once acknowledged. */
  id?: number;
  unsubscribe(): Promise<boolean>;
  /** End the stream locally and close its socket. */
  close(): void;
}

/** Create a {@link PreconfWsClient} for a full endpoint URL (API key included); usually prefer {@link makePreconfWsClientForApiKey}. */
export const makePreconfWsClient = (
  preconfWsUrl: string,
  options: PreconfWsClientOptions = {}
): PreconfWsClient => {
  const WS = (options.WebSocket ?? globalThis.WebSocket) as
    | (new (url: string) => WebSocket)
    | undefined;
  let closed = false;
  // Every open socket, including subscribes awaiting their ack
  const live = new Set<Stream>();

  const open = (filter?: PreconfFilter): Promise<PreconfSubscription> =>
    new Promise((resolve, reject) => {
      // Serialized now: later edits to the filter can't change it, and a bad
      // value (e.g. a bigint) rejects here
      let request = JSON.stringify({
        jsonrpc: "2.0",
        id: SUBSCRIBE_ID,
        method: "preconfSubscribe",
        ...(filter ? { params: [filter] } : {}),
      });
      filter = undefined;
      if (!WS) {
        throw new Error(
          "No WebSocket implementation found. On Node 20, pass `WebSocket` from the `ws` package in the client options."
        );
      }
      const socket = new WS(preconfWsUrl);
      // ArrayBuffer frames in browsers
      try {
        (socket as { binaryType?: string }).binaryType = "arraybuffer";
      } catch {}

      let ended = false;
      let keepalive: ReturnType<typeof setInterval> | undefined;
      // Armed now to cover a handshake that never answers
      let ackTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
        () => finish(new Error("preconfSubscribe timed out")),
        ACK_TIMEOUT_MS
      );

      const finish = (err?: Error) => {
        if (ended) return;
        ended = true;
        clearInterval(keepalive);
        clearTimeout(ackTimer);
        live.delete(stream);
        if (stream.id === undefined) {
          reject(err ?? new Error("Pre Confirmations WebSocket client closed"));
        }
        if (err) sink.error(err);
        else sink.done(true);
        socket.close();
      };

      const stream: Stream = {
        // The socket carries only this subscription, and closing a connection
        // removes its subscriptions server-side (per the preconfUnsubscribe docs)
        unsubscribe() {
          if (ended || stream.id === undefined) return Promise.resolve(false);
          finish();
          return Promise.resolve(true);
        },
        close: () => finish(),
      };
      const { sink, iterable } = makePushQueue(() => void stream.unsubscribe());
      live.add(stream);

      socket.onopen = () => {
        if (ended) return; // Closed, failed, or timed out before opening
        socket.send(request);
        request = ""; // A large filter shouldn't live as long as the stream
        // Filtered streams can be quiet; sockets without ping() (browsers,
        // Node 22+) send a JSON-RPC ping like enhancedWs (reply ignored)
        keepalive = setInterval(() => {
          try {
            const { ping } = socket as { ping?: () => void };
            if (ping) ping.call(socket);
            else {
              socket.send(
                JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping" })
              );
            }
          } catch {}
        }, KEEPALIVE_INTERVAL_MS);
      };

      socket.onmessage = (event: MessageEvent) => {
        const { data } = event;
        if (typeof data !== "string") {
          const bytes = toUint8Array(data);
          if (!bytes || ended || stream.id === undefined) return;
          try {
            sink.push(decodePreconfFrame(bytes));
          } catch {
            // Skip a bad frame rather than end the stream
          }
          return;
        }
        let msg: {
          id?: number | null;
          result?: unknown;
          error?: { code?: number; message?: string };
        };
        try {
          msg = JSON.parse(data);
        } catch {
          return; // Malformed JSON — ignore
        }
        if (!msg || typeof msg !== "object") return; // e.g. a bare `null`
        // Only the subscribe awaits a reply, so an `id: null` error is its
        const subscribing =
          stream.id === undefined &&
          (msg.id === SUBSCRIBE_ID || (msg.id === null && msg.error));
        if (subscribing) {
          clearTimeout(ackTimer);
          if (typeof msg.result !== "number" && !msg.error) {
            // Without an id it could never be unsubscribed
            finish(new Error("preconfSubscribe returned no subscription id"));
            return;
          }
          if (msg.error) {
            finish(rpcError(msg.error));
            return;
          }
          stream.id = msg.result as number;
          resolve({
            subscriptionId: stream.id,
            unsubscribe: stream.unsubscribe,
            [Symbol.asyncIterator]: () => iterable[Symbol.asyncIterator](),
          });
        }
      };

      // No-ops after an unsubscribe or close()
      socket.onerror = () =>
        finish(new Error("Pre Confirmations WebSocket connection error"));
      socket.onclose = () =>
        finish(
          new Error(
            "Pre Confirmations WebSocket connection closed unexpectedly"
          )
        );
    });

  return {
    async preconfSubscribe(filter?: PreconfFilter) {
      if (closed) throw new Error("Pre Confirmations WebSocket client closed");
      return open(filter);
    },

    async preconfUnsubscribe(subscriptionId: number): Promise<boolean> {
      const matches = [...live].filter((s) => s.id === subscriptionId);
      if (matches.length > 1) {
        throw new Error(
          `Subscription id ${subscriptionId} matches ${matches.length} subscriptions; call unsubscribe() on the subscription instead`
        );
      }
      return matches[0] ? matches[0].unsubscribe() : false;
    },

    async getPreConfCoverage(): Promise<PreconfCoverage> {
      // Same host and api key over HTTPS
      const url = new URL(preconfWsUrl);
      url.protocol = url.protocol === "ws:" ? "http:" : "https:";
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSDKHeaders() },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getPreConfCoverage",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let detail = text.slice(0, 200) || res.statusText;
        try {
          detail = JSON.parse(text).error?.message ?? detail;
        } catch {
          // Not JSON: keep the raw text
        }
        throw new Error(`getPreConfCoverage HTTP ${res.status}: ${detail}`);
      }
      const body = (await res.json()) as {
        result?: PreconfCoverage;
        error?: { code?: number; message?: string };
      };
      if (body.error) throw rpcError(body.error);
      if (!body.result) {
        throw new Error("Unexpected getPreConfCoverage response");
      }
      return body.result;
    },

    close() {
      closed = true;
      for (const stream of [...live]) stream.close();
    },
  };
};

/** Create a {@link PreconfWsClient} for an API key on the Gatekeeper endpoint. */
export const makePreconfWsClientForApiKey = (
  apiKey: string,
  options?: PreconfWsClientOptions
): PreconfWsClient =>
  makePreconfWsClient(`${PRECONF_WEBSOCKET_URL}${apiKey}`, options);
