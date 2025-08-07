import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleNewAddressProofsRequest,
  GetMultipleNewAddressProofsResponse,
} from "../types";

export type GetMultipleNewAddressProofsFn = (
  p: GetMultipleNewAddressProofsRequest
) => Promise<GetMultipleNewAddressProofsResponse>;

export const makeGetMultipleNewAddressProofs =
  (call: RpcCaller): GetMultipleNewAddressProofsFn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsRequest,
      GetMultipleNewAddressProofsResponse
    >("getMultipleNewAddressProofs", params);
