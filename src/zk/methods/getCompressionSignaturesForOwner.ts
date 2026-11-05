import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressionSignaturesForOwnerFn,
  GetCompressionSignaturesForOwnerRequest,
  GetCompressionSignaturesForOwnerResponse,
} from "../types.js";

export const makeGetCompressionSignaturesForOwner =
  (call: RpcCaller): GetCompressionSignaturesForOwnerFn =>
  (params) =>
    call<
      GetCompressionSignaturesForOwnerRequest,
      GetCompressionSignaturesForOwnerResponse
    >("getCompressionSignaturesForOwner", params);
