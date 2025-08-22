import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressedAccountFn,
  GetCompressedAccountRequest,
  GetCompressedAccountResponse,
} from "../types";

export const makeGetCompressedAccount =
  (call: RpcCaller): GetCompressedAccountFn =>
  (params) =>
    call<GetCompressedAccountRequest, GetCompressedAccountResponse>(
      "getCompressedAccount",
      params
    );
