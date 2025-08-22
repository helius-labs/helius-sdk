import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleNewAddressProofsFn,
  GetMultipleNewAddressProofsRequest,
  GetMultipleNewAddressProofsResponse,
} from "../types";

export const makeGetMultipleNewAddressProofs =
  (call: RpcCaller): GetMultipleNewAddressProofsFn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsRequest,
      GetMultipleNewAddressProofsResponse
    >("getMultipleNewAddressProofs", params);
