// src/zk/client.ts
import { defineLazyMethod } from "../rpc/lazy";
import type { RpcCaller } from "../rpc/caller";
import type {
  GetCompressedAccountFn,
} from "./methods/getCompressedAccount";
import { GetCompressedAccountProofFn } from "./methods/getCompressedAccountProof";

export interface ZkClientLazy {
  getCompressedAccount: GetCompressedAccountFn;
  getCompressedAccountProof: GetCompressedAccountProofFn;
}

export const makeZkClientLazy = (call: RpcCaller): ZkClientLazy => {
  const obj: any = {};

  defineLazyMethod<ZkClientLazy, GetCompressedAccountFn>(
    obj,
    "getCompressedAccount",
    async () => {
      const { makeGetCompressedAccount } = await import(
        "./methods/getCompressedAccount"
      );
      return makeGetCompressedAccount(call);
    },
  );

  defineLazyMethod<ZkClientLazy, GetCompressedAccountProofFn>(
    obj,
    "getCompressedAccountProof",
    async () => {
      const { makeGetCompressedAccountProof } = await import(
        "./methods/getCompressedAccountProof"
      );
      return makeGetCompressedAccountProof(call);
    },
  );

  return obj as ZkClientLazy;
};
