import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetTransactionWithCompressionInfoFn,
  GetTransactionWithCompressionInfoRequest,
  GetTransactionWithCompressionInfoResponse,
} from "../types.js";

export const makeGetTransactionWithCompressionInfo =
  (call: RpcCaller): GetTransactionWithCompressionInfoFn =>
  (params) =>
    call<
      GetTransactionWithCompressionInfoRequest,
      GetTransactionWithCompressionInfoResponse
    >("getTransactionWithCompressionInfo", params);
