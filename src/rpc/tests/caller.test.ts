import type { RpcTransport } from "@solana/kit";
import { HeliusRpcError, makeRpcCaller } from "../caller";

const callerReturning = (response: unknown) => {
  const transport = jest.fn().mockResolvedValue(response);
  return {
    call: makeRpcCaller(transport as unknown as RpcTransport),
    transport,
  };
};

describe("makeRpcCaller", () => {
  it("sends a JSON-RPC 2.0 payload and returns the result", async () => {
    const { call, transport } = callerReturning({
      jsonrpc: "2.0",
      id: "helius-sdk",
      result: { id: "asset1" },
    });

    await expect(call("getAsset", { id: "asset1" })).resolves.toEqual({
      id: "asset1",
    });
    expect(transport).toHaveBeenCalledWith({
      payload: {
        jsonrpc: "2.0",
        id: "helius-sdk",
        method: "getAsset",
        params: { id: "asset1" },
      },
    });
  });

  it("returns a null result as null, not the response envelope", async () => {
    const { call } = callerReturning({
      jsonrpc: "2.0",
      id: "helius-sdk",
      result: null,
    });

    await expect(call("getAsset", { id: "missing" })).resolves.toBeNull();
  });

  it.each([0, false, ""])(
    "returns the falsy result %p as-is",
    async (result) => {
      const { call } = callerReturning({ jsonrpc: "2.0", id: "1", result });

      await expect(call("getIndexerSlot", {})).resolves.toBe(result);
    }
  );

  it("throws a HeliusRpcError carrying the method, code, and data", async () => {
    const { call } = callerReturning({
      jsonrpc: "2.0",
      id: "helius-sdk",
      error: {
        code: -32602,
        message: "Invalid params",
        data: { field: "id" },
      },
    });

    const err = await call("getAsset", { id: 1 }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(HeliusRpcError);
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({
      name: "HeliusRpcError",
      message: "RPC error (getAsset): Invalid params",
      method: "getAsset",
      code: -32602,
      data: { field: "id" },
    });
  });

  it("stringifies an error without a message", async () => {
    const { call } = callerReturning({
      jsonrpc: "2.0",
      id: "helius-sdk",
      error: { code: -32000 },
    });

    const err = await call("getAsset", {}).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(HeliusRpcError);
    expect((err as HeliusRpcError).message).toBe(
      'RPC error (getAsset): {"code":-32000}'
    );
    expect((err as HeliusRpcError).data).toBeUndefined();
  });

  it("stringifies an error with an empty message", async () => {
    const { call } = callerReturning({
      jsonrpc: "2.0",
      id: "helius-sdk",
      error: { code: -32000, message: "" },
    });

    await expect(call("getAsset", {})).rejects.toThrow(
      'RPC error (getAsset): {"code":-32000,"message":""}'
    );
  });

  it.each([
    ["a body without result or error", { message: "Unauthorized" }],
    ["an undefined response", undefined],
  ])("rejects %s as an invalid JSON-RPC response", async (_label, response) => {
    const { call } = callerReturning(response);

    await expect(call("getAsset", {})).rejects.toThrow(
      "Invalid JSON-RPC response (getAsset): missing result and error"
    );
  });

  it("propagates transport failures unchanged", async () => {
    const failure = new Error("HTTP error (503)");
    const transport = jest.fn().mockRejectedValue(failure);
    const call = makeRpcCaller(transport as unknown as RpcTransport);

    await expect(call("getAsset", {})).rejects.toBe(failure);
  });
});
