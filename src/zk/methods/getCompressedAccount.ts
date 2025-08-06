import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressedAccountRequest,
  GetCompressedAccountResponse,
} from "../types";

export type GetCompressedAccountFn = (
  p: GetCompressedAccountRequest
) => Promise<GetCompressedAccountResponse>;

export const makeGetCompressedAccount =
  (call: RpcCaller): GetCompressedAccountFn =>
  (params) =>
    call<GetCompressedAccountRequest, GetCompressedAccountResponse>(
      "getCompressedAccount",
      params
    );
