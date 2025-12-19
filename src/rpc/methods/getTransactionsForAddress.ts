import type {
  GetTransactionsForAddressConfigFull,
  GetTransactionsForAddressConfigSignatures,
  GetTransactionsForAddressResultFull,
  GetTransactionsForAddressResultSignatures,
} from "../../types";
import type { RpcCaller } from "../caller";

// Function overloads: return type based on transactionDetails config
export type GetTransactionsForAddressFn = {
  // transactionDetails: "full" => returns full transaction data
  (
    params: [string, GetTransactionsForAddressConfigFull]
  ): Promise<GetTransactionsForAddressResultFull>;

  // transactionDetails: "signatures" or omitted => returns signature data (default)
  (
    params: [string, GetTransactionsForAddressConfigSignatures?]
  ): Promise<GetTransactionsForAddressResultSignatures>;
};

export const makeGetTransactionsForAddress =
  (call: RpcCaller): GetTransactionsForAddressFn =>
  ((params: [string, any?]) =>
    call("getTransactionsForAddress", params)) as GetTransactionsForAddressFn;
