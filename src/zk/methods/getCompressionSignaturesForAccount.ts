import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressionSignaturesForAccountFn,
  GetCompressionSignaturesForAccountRequest,
  GetCompressionSignaturesForAccountResponse,
} from "../types";

export const makeGetCompressionSignaturesForAccount =
  (call: RpcCaller): GetCompressionSignaturesForAccountFn =>
  (params) =>
    call<
      GetCompressionSignaturesForAccountRequest,
      GetCompressionSignaturesForAccountResponse
    >("getCompressionSignaturesForAccount", params);
