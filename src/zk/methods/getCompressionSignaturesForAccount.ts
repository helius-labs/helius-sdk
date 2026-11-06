import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressionSignaturesForAccountFn,
  GetCompressionSignaturesForAccountRequest,
  GetCompressionSignaturesForAccountResponse,
} from "../types.js";

export const makeGetCompressionSignaturesForAccount =
  (call: RpcCaller): GetCompressionSignaturesForAccountFn =>
  (params) =>
    call<
      GetCompressionSignaturesForAccountRequest,
      GetCompressionSignaturesForAccountResponse
    >("getCompressionSignaturesForAccount", params);
