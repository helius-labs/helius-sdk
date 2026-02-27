import type {
  TransactionSubscribeFilter,
  TransactionSubscribeConfig,
  TransactionNotificationResult,
  EnhancedAccountSubscribeConfig,
  EnhancedAccountNotificationResult,
  EnhancedSubscription,
} from "./types";

/** Maximum buffered notifications per subscription before oldest are dropped. */
const BUFFER_LIMIT = 10_000;

/** Keepalive ping interval in milliseconds. */
const KEEPALIVE_INTERVAL_MS = 30_000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

interface SubscriptionSink<T> {
  push: (value: T) => void;
  done: () => void;
  error: (err: Error) => void;
}

/**
 * Client for Helius Enhanced WebSocket subscriptions.
 */
export interface EnhancedWsClient {
  transactionSubscribe(
    filter: TransactionSubscribeFilter,
    config?: TransactionSubscribeConfig
  ): Promise<EnhancedSubscription<TransactionNotificationResult>>;

  transactionUnsubscribe(subscriptionId: number): Promise<boolean>;

  accountSubscribe(
    account: string,
    config?: EnhancedAccountSubscribeConfig
  ): Promise<EnhancedSubscription<EnhancedAccountNotificationResult>>;

  accountUnsubscribe(subscriptionId: number): Promise<boolean>;

  close(): void;
}

/** Create an Enhanced WebSocket client connected to the given atlas-* URL. */
export const makeEnhancedWsClient = (
  enhancedWsUrl: string
): EnhancedWsClient => {
  let ws: WebSocket | undefined;
  let connecting: Promise<WebSocket> | undefined;
  let closed = false;
  let nextId = 1;
  let keepaliveTimer: ReturnType<typeof setInterval> | undefined;

  const pendingRequests = new Map<number, PendingRequest>();
  const subscriptions = new Map<number, SubscriptionSink<any>>();

  const cleanup = (reason?: Error) => {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = undefined;
    }
    for (const [, req] of pendingRequests) {
      req.reject(reason ?? new Error("Enhanced WebSocket client closed"));
    }
    pendingRequests.clear();
    for (const [, sub] of subscriptions) {
      if (reason) {
        sub.error(reason);
      } else {
        sub.done();
      }
    }
    subscriptions.clear();
    ws = undefined;
    connecting = undefined;
  };

  const handleMessage = (data: string) => {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      // Malformed JSON — ignore
      return;
    }

    // JSON-RPC response (has id)
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
      return;
    }

    // Subscription notification (has method + params.subscription)
    if (msg.method && msg.params?.subscription != null) {
      const sink = subscriptions.get(msg.params.subscription);
      if (sink) {
        sink.push(msg.params.result);
      }
      // Unknown subscription ID — silently ignore
    }
  };

  const connect = (): Promise<WebSocket> => {
    if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws);
    if (connecting) return connecting;

    connecting = new Promise<WebSocket>((resolve, reject) => {
      if (closed) {
        reject(new Error("Enhanced WebSocket client closed"));
        return;
      }

      const socket = new WebSocket(enhancedWsUrl);

      socket.onopen = () => {
        if (closed) {
          socket.close();
          reject(new Error("Enhanced WebSocket client closed"));
          return;
        }
        ws = socket;

        // Start keepalive
        keepaliveTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              if (typeof (ws as any).ping === "function") {
                (ws as any).ping();
              } else {
                ws.send(
                  JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping" })
                );
              }
            } catch {
              // Ignore keepalive errors
            }
          }
        }, KEEPALIVE_INTERVAL_MS);

        resolve(socket);
      };

      socket.onerror = () => {
        const err = new Error("Enhanced WebSocket connection error");
        cleanup(err);
        reject(err);
      };

      socket.onclose = () => {
        cleanup(new Error("Enhanced WebSocket connection closed unexpectedly"));
      };

      socket.onmessage = (event) => {
        handleMessage(
          typeof event.data === "string" ? event.data : String(event.data)
        );
      };
    });

    return connecting;
  };

  const sendRequest = async (
    method: string,
    params: unknown
  ): Promise<unknown> => {
    const socket = await connect();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  };

  const makePushQueue = <T>(): {
    sink: SubscriptionSink<T>;
    iterable: AsyncIterable<T>;
  } => {
    const buffer: T[] = [];
    let waiting: ((value: IteratorResult<T>) => void) | undefined;
    let finished = false;
    let iteratorError: Error | undefined;

    const sink: SubscriptionSink<T> = {
      push(value: T) {
        if (finished) return;
        if (waiting) {
          const resolve = waiting;
          waiting = undefined;
          resolve({ value, done: false });
        } else {
          if (buffer.length >= BUFFER_LIMIT) {
            buffer.shift(); // Drop oldest
          }
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
      error(err: Error) {
        iteratorError = err;
        finished = true;
        if (waiting) {
          const resolve = waiting;
          waiting = undefined;
          resolve({ value: undefined as any, done: true });
        }
      },
    };

    const iterable: AsyncIterable<T> = {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<T>> {
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
          return(): Promise<IteratorResult<T>> {
            finished = true;
            buffer.length = 0;
            return Promise.resolve({ value: undefined as any, done: true });
          },
        };
      },
    };

    return { sink, iterable };
  };

  const subscribe = async <T>(
    method: string,
    params: unknown[],
    unsubMethod: string
  ): Promise<EnhancedSubscription<T>> => {
    if (closed) throw new Error("Enhanced WebSocket client closed");

    const subscriptionId = (await sendRequest(method, params)) as number;
    const { sink, iterable } = makePushQueue<T>();
    subscriptions.set(subscriptionId, sink);

    const sub: EnhancedSubscription<T> = {
      subscriptionId,
      async unsubscribe(): Promise<boolean> {
        subscriptions.delete(subscriptionId);
        sink.done();
        try {
          return (await sendRequest(unsubMethod, [subscriptionId])) as boolean;
        } catch {
          return false;
        }
      },
      [Symbol.asyncIterator]() {
        return iterable[Symbol.asyncIterator]();
      },
    };

    return sub;
  };

  return {
    transactionSubscribe(filter, config) {
      const params: unknown[] = config ? [filter, config] : [filter];
      return subscribe<TransactionNotificationResult>(
        "transactionSubscribe",
        params,
        "transactionUnsubscribe"
      );
    },

    async transactionUnsubscribe(subscriptionId) {
      const sink = subscriptions.get(subscriptionId);
      if (sink) {
        subscriptions.delete(subscriptionId);
        sink.done();
      }
      return (await sendRequest("transactionUnsubscribe", [
        subscriptionId,
      ])) as boolean;
    },

    accountSubscribe(account, config) {
      const params: unknown[] = config ? [account, config] : [account];
      return subscribe<EnhancedAccountNotificationResult>(
        "accountSubscribe",
        params,
        "accountUnsubscribe"
      );
    },

    async accountUnsubscribe(subscriptionId) {
      const sink = subscriptions.get(subscriptionId);
      if (sink) {
        subscriptions.delete(subscriptionId);
        sink.done();
      }
      return (await sendRequest("accountUnsubscribe", [
        subscriptionId,
      ])) as boolean;
    },

    close() {
      closed = true;
      const socket = ws;
      cleanup();
      if (socket) {
        socket.close();
      }
    },
  };
};
