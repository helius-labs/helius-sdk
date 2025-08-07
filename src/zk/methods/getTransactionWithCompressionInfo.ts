import type { RpcCaller } from "../../rpc/caller";
import type {
  GetTransactionWithCompressionInfoRequest,
  GetTransactionWithCompressionInfoResponse,
} from "../types";

export type GetTransactionWithCompressionInfoFn = (
  p: GetTransactionWithCompressionInfoRequest
) => Promise<GetTransactionWithCompressionInfoResponse>;

export const makeGetTransactionWithCompressionInfo =
  (call: RpcCaller): GetTransactionWithCompressionInfoFn =>
  (params) =>
    call<
      GetTransactionWithCompressionInfoRequest,
      GetTransactionWithCompressionInfoResponse
    >("getTransactionWithCompressionInfo", params);
