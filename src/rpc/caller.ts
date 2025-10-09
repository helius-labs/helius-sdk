import type { RpcTransport } from "@solana/kit";

export type RpcCaller = <P, R>(method: string, params: P) => Promise<R>;

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

    if (res?.error) {
      throw new Error(
        `RPC error (${method}): ${res.error?.message ?? JSON.stringify(res.error)}`
      );
    }
    return (res.result ?? res) as any;
  };
