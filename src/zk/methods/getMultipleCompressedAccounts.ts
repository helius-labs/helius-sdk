import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleCompressedAccountsFn,
  GetMultipleCompressedAccountsRequest,
  GetMultipleCompressedAccountsResponse,
} from "../types";

export const makeGetMultipleCompressedAccounts =
  (call: RpcCaller): GetMultipleCompressedAccountsFn =>
  (params) =>
    call<
      GetMultipleCompressedAccountsRequest,
      GetMultipleCompressedAccountsResponse
    >("getMultipleCompressedAccounts", params);
