import { defineLazyMethod } from "../rpc/lazy";
import type { RpcCaller } from "../rpc/caller";
import type { GetCompressedAccountFn } from "./methods/getCompressedAccount";
import { GetCompressedAccountProofFn } from "./methods/getCompressedAccountProof";
import { GetCompressedAccountsByOwnerFn } from "./methods/getCompressedAccountsByOwner";
import {
  GetCompressedBalanceByOwnerFn,
  GetCompressedBalanceFn,
  GetCompressedMintTokenHoldersFn,
  GetCompressedTokenAccountBalanceFn,
} from "./types";

export interface ZkClientLazy {
  getCompressedAccount: GetCompressedAccountFn;
  getCompressedAccountProof: GetCompressedAccountProofFn;
  getCompressedAccountsByOwner: GetCompressedAccountsByOwnerFn;
  getCompressedBalance: GetCompressedBalanceFn;
  getCompressedBalanceByOwner: GetCompressedBalanceByOwnerFn;
  getCompressedMintTokenHolders: GetCompressedMintTokenHoldersFn;
  getCompressedTokenAccountBalance: GetCompressedTokenAccountBalanceFn;
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
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedAccountProofFn>(
    obj,
    "getCompressedAccountProof",
    async () => {
      const { makeGetCompressedAccountProof } = await import(
        "./methods/getCompressedAccountProof"
      );
      return makeGetCompressedAccountProof(call);
    }
  );

  defineLazyMethod(obj, "getCompressedAccountsByOwner", async () => {
    const { makeGetCompressedAccountsByOwner } = await import(
      "./methods/getCompressedAccountsByOwner"
    );
    return makeGetCompressedAccountsByOwner(call);
  });

  defineLazyMethod(obj, "getCompressedBalance", async () => {
    const { makeGetCompressedBalance } = await import(
      "./methods/getCompressedBalance"
    );
    return makeGetCompressedBalance(call);
  });

  defineLazyMethod<ZkClientLazy, GetCompressedBalanceByOwnerFn>(
    obj,
    "getCompressedBalanceByOwner",
    async () => {
      const { makeGetCompressedBalanceByOwner } = await import(
        "./methods/getCompressedBalanceByOwner"
      );
      return makeGetCompressedBalanceByOwner(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedMintTokenHoldersFn>(
    obj,
    "getCompressedMintTokenHolders",
    async () => {
      const { makeGetCompressedMintTokenHolders } = await import(
        "./methods/getCompressedMintTokenHolders"
      );
      return makeGetCompressedMintTokenHolders(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedTokenAccountBalanceFn>(
  obj,
  "getCompressedTokenAccountBalance",
  async () => {
    const { makeGetCompressedTokenAccountBalance } = await import(
      "./methods/getCompressedTokenAccountBalance"
    );
    return makeGetCompressedTokenAccountBalance(call);
  },
);

  return obj as ZkClientLazy;
};
