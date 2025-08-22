import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressionSignaturesForOwnerFn,
  GetCompressionSignaturesForOwnerRequest,
  GetCompressionSignaturesForOwnerResponse,
} from "../types";

export const makeGetCompressionSignaturesForOwner =
  (call: RpcCaller): GetCompressionSignaturesForOwnerFn =>
  (params) =>
    call<
      GetCompressionSignaturesForOwnerRequest,
      GetCompressionSignaturesForOwnerResponse
    >("getCompressionSignaturesForOwner", params);
