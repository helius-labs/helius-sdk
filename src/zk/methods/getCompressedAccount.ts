import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressedAccountFn,
  GetCompressedAccountRequest,
  GetCompressedAccountResponse,
} from "../types.js";

export const makeGetCompressedAccount =
  (call: RpcCaller): GetCompressedAccountFn =>
  (params) =>
    call<GetCompressedAccountRequest, GetCompressedAccountResponse>(
      "getCompressedAccount",
      params
    );
