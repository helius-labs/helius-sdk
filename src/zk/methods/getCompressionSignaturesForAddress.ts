import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressionSignaturesForAddressFn,
  GetCompressionSignaturesForAddressRequest,
  GetCompressionSignaturesForAddressResponse,
} from "../types";

export const makeGetCompressionSignaturesForAddress =
  (call: RpcCaller): GetCompressionSignaturesForAddressFn =>
  (params) =>
    call<
      GetCompressionSignaturesForAddressRequest,
      GetCompressionSignaturesForAddressResponse
    >("getCompressionSignaturesForAddress", params);
