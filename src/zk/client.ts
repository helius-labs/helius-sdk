// src/zk/client.ts
import { defineLazyMethod } from "../rpc/lazy";
import type { RpcCaller } from "../rpc/caller";
import type {
  GetCompressedAccountFn,
} from "./methods/getCompressedAccount";

export interface ZkClientLazy {
  getCompressedAccount: GetCompressedAccountFn;
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

  return obj as ZkClientLazy;
};
