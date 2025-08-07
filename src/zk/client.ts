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
  GetCompressedTokenAccountsByDelegateFn,
  GetCompressedTokenAccountsByOwnerFn,
  GetCompressedTokenBalancesByOwnerFn,
  GetCompressedTokenBalancesByOwnerV2Fn,
  GetCompressionSignaturesForAccountFn,
  GetCompressionSignaturesForAddressFn,
  GetCompressionSignaturesForOwnerFn,
  GetCompressionSignaturesForTokenOwnerFn,
  GetIndexerHealthFn,
} from "./types";

export interface ZkClientLazy {
  getCompressedAccount: GetCompressedAccountFn;
  getCompressedAccountProof: GetCompressedAccountProofFn;
  getCompressedAccountsByOwner: GetCompressedAccountsByOwnerFn;
  getCompressedBalance: GetCompressedBalanceFn;
  getCompressedBalanceByOwner: GetCompressedBalanceByOwnerFn;
  getCompressedMintTokenHolders: GetCompressedMintTokenHoldersFn;
  getCompressedTokenAccountBalance: GetCompressedTokenAccountBalanceFn;
  getCompressedTokenAccountsByDelegate: GetCompressedTokenAccountsByDelegateFn;
  getCompressedTokenAccountsByOwner: GetCompressedTokenAccountsByOwnerFn;
  getCompressedTokenBalancesByOwner: GetCompressedTokenBalancesByOwnerFn;
  getCompressedTokenBalancesByOwnerV2: GetCompressedTokenBalancesByOwnerV2Fn;
  getCompressionSignaturesForAccount: GetCompressionSignaturesForAccountFn;
  getCompressionSignaturesForAddress: GetCompressionSignaturesForAddressFn;
  getCompressionSignaturesForOwner: GetCompressionSignaturesForOwnerFn;
  getCompressionSignaturesForTokenOwner: GetCompressionSignaturesForTokenOwnerFn;
  getIndexerHealth: GetIndexerHealthFn;
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
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedTokenAccountsByDelegateFn>(
    obj,
    "getCompressedTokenAccountsByDelegate",
    async () => {
      const { makeGetCompressedTokenAccountsByDelegate } = await import(
        "./methods/getCompressedTokenAccountsByDelegate"
      );
      return makeGetCompressedTokenAccountsByDelegate(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedTokenAccountsByOwnerFn>(
    obj,
    "getCompressedTokenAccountsByOwner",
    async () => {
      const { makeGetCompressedTokenAccountsByOwner } = await import(
        "./methods/getCompressedTokenAccountsByOwner"
      );
      return makeGetCompressedTokenAccountsByOwner(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedTokenBalancesByOwnerFn>(
    obj,
    "getCompressedTokenBalancesByOwner",
    async () => {
      const { makeGetCompressedTokenBalancesByOwner } = await import(
        "./methods/getCompressedTokenBalancesByOwner"
      );
      return makeGetCompressedTokenBalancesByOwner(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressedTokenBalancesByOwnerV2Fn>(
    obj,
    "getCompressedTokenBalancesByOwnerV2",
    async () => {
      const { makeGetCompressedTokenBalancesByOwnerV2 } = await import(
        "./methods/getCompressedTokenBalancesByOwnerV2"
      );
      return makeGetCompressedTokenBalancesByOwnerV2(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressionSignaturesForAccountFn>(
    obj,
    "getCompressionSignaturesForAccount",
    async () => {
      const { makeGetCompressionSignaturesForAccount } = await import(
        "./methods/getCompressionSignaturesForAccount"
      );
      return makeGetCompressionSignaturesForAccount(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressionSignaturesForAddressFn>(
    obj,
    "getCompressionSignaturesForAddress",
    async () => {
      const { makeGetCompressionSignaturesForAddress } = await import(
        "./methods/getCompressionSignaturesForAddress"
      );
      return makeGetCompressionSignaturesForAddress(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressionSignaturesForOwnerFn>(
    obj,
    "getCompressionSignaturesForOwner",
    async () => {
      const { makeGetCompressionSignaturesForOwner } = await import(
        "./methods/getCompressionSignaturesForOwner"
      );
      return makeGetCompressionSignaturesForOwner(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetCompressionSignaturesForTokenOwnerFn>(
    obj,
    "getCompressionSignaturesForTokenOwner",
    async () => {
      const { makeGetCompressionSignaturesForTokenOwner } = await import(
        "./methods/getCompressionSignaturesForTokenOwner"
      );
      return makeGetCompressionSignaturesForTokenOwner(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetIndexerHealthFn>(
    obj,
    "getIndexerHealth",
    async () => {
      const { makeGetIndexerHealth } = await import(
        "./methods/getIndexerHealth"
      );
      return makeGetIndexerHealth(call);
    }
  );

  return obj as ZkClientLazy;
};
