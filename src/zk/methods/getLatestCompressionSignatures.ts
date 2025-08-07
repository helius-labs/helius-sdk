import type { RpcCaller } from "../../rpc/caller";
import type {
  GetLatestCompressionSignaturesFn,
  GetLatestCompressionSignaturesRequest,
  GetLatestCompressionSignaturesResponse,
} from "../types";

export const makeGetLatestCompressionSignatures =
  (call: RpcCaller): GetLatestCompressionSignaturesFn =>
  (params = {}) =>
    call<
      GetLatestCompressionSignaturesRequest,
      GetLatestCompressionSignaturesResponse
    >("getLatestCompressionSignatures", params);
