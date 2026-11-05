import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressionSignaturesForTokenOwnerFn,
  GetCompressionSignaturesForTokenOwnerRequest,
  GetCompressionSignaturesForTokenOwnerResponse,
} from "../types.js";

export const makeGetCompressionSignaturesForTokenOwner =
  (call: RpcCaller): GetCompressionSignaturesForTokenOwnerFn =>
  (params) =>
    call<
      GetCompressionSignaturesForTokenOwnerRequest,
      GetCompressionSignaturesForTokenOwnerResponse
    >("getCompressionSignaturesForTokenOwner", params);
