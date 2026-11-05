import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetMultipleCompressedAccountsFn,
  GetMultipleCompressedAccountsRequest,
  GetMultipleCompressedAccountsResponse,
} from "../types.js";

export const makeGetMultipleCompressedAccounts =
  (call: RpcCaller): GetMultipleCompressedAccountsFn =>
  (params) =>
    call<
      GetMultipleCompressedAccountsRequest,
      GetMultipleCompressedAccountsResponse
    >("getMultipleCompressedAccounts", params);
