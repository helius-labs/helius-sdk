import type { RpcCaller } from "../../rpc/caller";
import type {
  GetTransactionWithCompressionInfoFn,
  GetTransactionWithCompressionInfoRequest,
  GetTransactionWithCompressionInfoResponse,
} from "../types";

export const makeGetTransactionWithCompressionInfo =
  (call: RpcCaller): GetTransactionWithCompressionInfoFn =>
  (params) =>
    call<
      GetTransactionWithCompressionInfoRequest,
      GetTransactionWithCompressionInfoResponse
    >("getTransactionWithCompressionInfo", params);
