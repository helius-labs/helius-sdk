import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressionSignaturesForAddressFn,
  GetCompressionSignaturesForAddressRequest,
  GetCompressionSignaturesForAddressResponse,
} from "../types.js";

export const makeGetCompressionSignaturesForAddress =
  (call: RpcCaller): GetCompressionSignaturesForAddressFn =>
  (params) =>
    call<
      GetCompressionSignaturesForAddressRequest,
      GetCompressionSignaturesForAddressResponse
    >("getCompressionSignaturesForAddress", params);
