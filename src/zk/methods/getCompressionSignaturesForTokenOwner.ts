import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressionSignaturesForTokenOwnerFn,
  GetCompressionSignaturesForTokenOwnerRequest,
  GetCompressionSignaturesForTokenOwnerResponse,
} from "../types";

export const makeGetCompressionSignaturesForTokenOwner =
  (call: RpcCaller): GetCompressionSignaturesForTokenOwnerFn =>
  (params) =>
    call<
      GetCompressionSignaturesForTokenOwnerRequest,
      GetCompressionSignaturesForTokenOwnerResponse
    >("getCompressionSignaturesForTokenOwner", params);
