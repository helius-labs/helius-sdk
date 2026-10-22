import type { RpcTransport } from "@solana/kit";

export type RpcCaller = <P, R>(method: string, params: P) => Promise<R>;

/**
 * Thrown when a Helius RPC method (DAS, ZK Compression, and other Helius
 * methods on the client) returns a JSON-RPC error response.
 */
export class HeliusRpcError extends Error {
  /** The JSON-RPC method that failed, e.g. `"getAsset"`. */
  readonly method: string;
  /** The JSON-RPC error code, e.g. `-32602` for invalid params. */
  readonly code?: number;
  /** Additional error detail from the server, if any. */
  readonly data?: unknown;

  constructor(
    method: string,
    error: { code?: number; message?: string; data?: unknown }
  ) {
    super(`RPC error (${method}): ${error.message || JSON.stringify(error)}`);
    this.name = "HeliusRpcError";
    this.method = method;
    this.code = error.code;
    this.data = error.data;
  }
}

export const makeRpcCaller =
  (transport: RpcTransport): RpcCaller =>
  async (method, params) => {
    const res = (await transport({
      payload: {
        jsonrpc: "2.0",
        id: "helius-sdk",
        method,
        params,
      },
    })) as any;

    if (res?.error) throw new HeliusRpcError(method, res.error);
    // `null` is a valid JSON-RPC result; only a missing `result` is malformed
    if (res?.result === undefined) {
      throw new Error(
        `Invalid JSON-RPC response (${method}): missing result and error`
      );
    }
    return res.result;
  };
