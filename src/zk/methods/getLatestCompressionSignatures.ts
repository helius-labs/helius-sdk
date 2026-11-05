import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetLatestCompressionSignaturesFn,
  GetLatestCompressionSignaturesRequest,
  GetLatestCompressionSignaturesResponse,
} from "../types.js";

export const makeGetLatestCompressionSignatures =
  (call: RpcCaller): GetLatestCompressionSignaturesFn =>
  (params = {}) =>
    call<
      GetLatestCompressionSignaturesRequest,
      GetLatestCompressionSignaturesResponse
    >("getLatestCompressionSignatures", params);
