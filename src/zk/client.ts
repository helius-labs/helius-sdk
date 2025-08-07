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
  GetIndexerSlotFn,
  GetLatestCompressionSignaturesFn,
  GetLatestNonVotingSignaturesFn,
  GetMultipleCompressedAccountProofsFn,
  GetMultipleCompressedAccountsFn,
} from "./types";
import { GetMultipleNewAddressProofsFn } from "./methods/getMultipleNewAddressProofs";
import { GetMultipleNewAddressProofsV2Fn } from "./methods/getMultipleNewAddressProofsV2";
import { GetTransactionWithCompressionInfoFn } from "./methods/getTransactionWithCompressionInfo";

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
  getIndexerSlot: GetIndexerSlotFn;
  getLatestCompressionSignatures: GetLatestCompressionSignaturesFn;
  getLatestNonVotingSignatures: GetLatestNonVotingSignaturesFn;
  getMultipleCompressedAccountProofs: GetMultipleCompressedAccountProofsFn;
  getMultipleCompressedAccounts: GetMultipleCompressedAccountsFn;
  getMultipleNewAddressProofs: GetMultipleNewAddressProofsFn;
  getMultipleNewAddressProofsV2: GetMultipleNewAddressProofsV2Fn;
  getTransactionWithCompressionInfo: GetTransactionWithCompressionInfoFn;
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

  defineLazyMethod<ZkClientLazy, GetIndexerSlotFn>(
    obj,
    "getIndexerSlot",
    async () => {
      const { makeGetIndexerSlot } = await import("./methods/getIndexerSlot");
      return makeGetIndexerSlot(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetLatestCompressionSignaturesFn>(
    obj,
    "getLatestCompressionSignatures",
    async () => {
      const { makeGetLatestCompressionSignatures } = await import(
        "./methods/getLatestCompressionSignatures"
      );
      return makeGetLatestCompressionSignatures(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetLatestNonVotingSignaturesFn>(
    obj,
    "getLatestNonVotingSignatures",
    async () => {
      const { makeGetLatestNonVotingSignatures } = await import(
        "./methods/getLatestNonVotingSignatures"
      );
      return makeGetLatestNonVotingSignatures(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetMultipleCompressedAccountProofsFn>(
    obj,
    "getMultipleCompressedAccountProofs",
    async () => {
      const { makeGetMultipleCompressedAccountProofs } = await import(
        "./methods/getMultipleCompressedAccountProofs"
      );
      return makeGetMultipleCompressedAccountProofs(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetMultipleCompressedAccountsFn>(
    obj,
    "getMultipleCompressedAccounts",
    async () => {
      const { makeGetMultipleCompressedAccounts } = await import(
        "./methods/getMultipleCompressedAccounts"
      );
      return makeGetMultipleCompressedAccounts(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetMultipleNewAddressProofsFn>(
    obj,
    "getMultipleNewAddressProofs",
    async () => {
      const { makeGetMultipleNewAddressProofs } = await import(
        "./methods/getMultipleNewAddressProofs"
      );
      return makeGetMultipleNewAddressProofs(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetMultipleNewAddressProofsV2Fn>(
    obj,
    "getMultipleNewAddressProofsV2",
    async () => {
      const { makeGetMultipleNewAddressProofsV2 } = await import(
        "./methods/getMultipleNewAddressProofsV2"
      );
      return makeGetMultipleNewAddressProofsV2(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetTransactionWithCompressionInfoFn>(
    obj,
    "getTransactionWithCompressionInfo",
    async () => {
      const { makeGetTransactionWithCompressionInfo } = await import(
        "./methods/getTransactionWithCompressionInfo"
      );
      return makeGetTransactionWithCompressionInfo(call);
    }
  );

  return obj as ZkClientLazy;
};
