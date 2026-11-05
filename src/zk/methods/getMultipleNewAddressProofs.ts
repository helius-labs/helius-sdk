import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetMultipleNewAddressProofsFn,
  GetMultipleNewAddressProofsRequest,
  GetMultipleNewAddressProofsResponse,
} from "../types.js";

export const makeGetMultipleNewAddressProofs =
  (call: RpcCaller): GetMultipleNewAddressProofsFn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsRequest,
      GetMultipleNewAddressProofsResponse
    >("getMultipleNewAddressProofs", params);
