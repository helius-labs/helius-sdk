import { defineLazyMethod } from "../rpc/lazy";
import type { RpcCaller } from "../rpc/caller";
import type {
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
  GetSignaturesForAssetFn,
  GetValidityProofFn,
  GetTransactionWithCompressionInfoFn,
  GetMultipleNewAddressProofsFn,
  GetMultipleNewAddressProofsV2Fn,
  GetCompressedAccountsByOwnerFn,
  GetCompressedAccountProofFn,
  GetCompressedAccountFn,
} from "./types";

/**
 * Client for ZK compression RPC methods (Light Protocol).
 *
 * Provides access to compressed accounts, compressed tokens, Merkle proofs,
 * validity proofs, and compression-related transaction history.
 */
export interface ZkClientLazy {
  /** Get a single compressed account by address or hash. */
  getCompressedAccount: GetCompressedAccountFn;
  /** Get a Merkle proof for a compressed account. */
  getCompressedAccountProof: GetCompressedAccountProofFn;
  /** Get compressed accounts owned by a program. */
  getCompressedAccountsByOwner: GetCompressedAccountsByOwnerFn;
  /** Get the lamport balance of a compressed account. */
  getCompressedBalance: GetCompressedBalanceFn;
  /** Get the total compressed lamport balance for an owner. */
  getCompressedBalanceByOwner: GetCompressedBalanceByOwnerFn;
  /** Get all holders of a compressed token mint. */
  getCompressedMintTokenHolders: GetCompressedMintTokenHoldersFn;
  /** Get the token balance of a compressed token account. */
  getCompressedTokenAccountBalance: GetCompressedTokenAccountBalanceFn;
  /** Get compressed token accounts by their delegate. */
  getCompressedTokenAccountsByDelegate: GetCompressedTokenAccountsByDelegateFn;
  /** Get compressed token accounts owned by a wallet. */
  getCompressedTokenAccountsByOwner: GetCompressedTokenAccountsByOwnerFn;
  /** Get compressed token balances by owner (V1). */
  getCompressedTokenBalancesByOwner: GetCompressedTokenBalancesByOwnerFn;
  /** Get compressed token balances by owner (V2 — uses `items` instead of `token_balances`). */
  getCompressedTokenBalancesByOwnerV2: GetCompressedTokenBalancesByOwnerV2Fn;
  /** Get signatures for a specific compressed account. */
  getCompressionSignaturesForAccount: GetCompressionSignaturesForAccountFn;
  /** Get compression-related signatures for an address. */
  getCompressionSignaturesForAddress: GetCompressionSignaturesForAddressFn;
  /** Get compression-related signatures for an owner. */
  getCompressionSignaturesForOwner: GetCompressionSignaturesForOwnerFn;
  /** Get compression-related signatures for a token owner. */
  getCompressionSignaturesForTokenOwner: GetCompressionSignaturesForTokenOwnerFn;
  /** Check whether the compression indexer is healthy. */
  getIndexerHealth: GetIndexerHealthFn;
  /** Get the latest slot indexed by the compression indexer. */
  getIndexerSlot: GetIndexerSlotFn;
  /** Get the most recent compression-related signatures. */
  getLatestCompressionSignatures: GetLatestCompressionSignaturesFn;
  /** Get the most recent non-voting signatures. */
  getLatestNonVotingSignatures: GetLatestNonVotingSignaturesFn;
  /** Get Merkle proofs for multiple compressed accounts in a batch. */
  getMultipleCompressedAccountProofs: GetMultipleCompressedAccountProofsFn;
  /** Get multiple compressed accounts by address or hash. */
  getMultipleCompressedAccounts: GetMultipleCompressedAccountsFn;
  /** Get new address non-inclusion proofs (V1). */
  getMultipleNewAddressProofs: GetMultipleNewAddressProofsFn;
  /** Get new address non-inclusion proofs (V2 — with tree specification). */
  getMultipleNewAddressProofsV2: GetMultipleNewAddressProofsV2Fn;
  /** Get a transaction with its compression state changes. */
  getTransactionWithCompressionInfo: GetTransactionWithCompressionInfoFn;
  /** Get a ZK validity proof for account inclusion and address non-inclusion. */
  getValidityProof: GetValidityProofFn;
  /** Get signatures for a compressed asset. */
  getSignaturesForAsset: GetSignaturesForAssetFn;
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

  defineLazyMethod<ZkClientLazy, GetValidityProofFn>(
    obj,
    "getValidityProof",
    async () => {
      const { makeGetValidityProof } = await import(
        "./methods/getValidityProof"
      );
      return makeGetValidityProof(call);
    }
  );

  defineLazyMethod<ZkClientLazy, GetSignaturesForAssetFn>(
    obj,
    "getSignaturesForAsset",
    async () => {
      const { makeGetSignaturesForAsset } = await import(
        "./methods/getSignaturesForAsset"
      );
      return makeGetSignaturesForAsset(call);
    }
  );

  return obj as ZkClientLazy;
};
