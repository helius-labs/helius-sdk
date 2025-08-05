import { defineLazyMethod } from "../rpc/lazy";
import type { RpcCaller } from "../rpc/caller";
import type {
  GetCompressedAccountFn,
} from "./methods/getCompressedAccount";
import { GetCompressedAccountProofFn } from "./methods/getCompressedAccountProof";
import { GetCompressedAccountsByOwnerFn } from "./methods/getCompressedAccountsByOwner";

export interface ZkClientLazy {
  getCompressedAccount: GetCompressedAccountFn;
  getCompressedAccountProof: GetCompressedAccountProofFn;
  getCompressedAccountsByOwner: GetCompressedAccountsByOwnerFn;
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

  defineLazyMethod(obj, "getCompressedAccountsByOwner", async () => {
    const { makeGetCompressedAccountsByOwner } = await import(
      "./methods/getCompressedAccountsByOwner"
    );
    return makeGetCompressedAccountsByOwner(call);
  });

  return obj as ZkClientLazy;
};
