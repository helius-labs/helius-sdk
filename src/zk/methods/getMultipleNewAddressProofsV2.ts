import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetMultipleNewAddressProofsV2Fn,
  GetMultipleNewAddressProofsV2Request,
  GetMultipleNewAddressProofsV2Response,
} from "../types.js";

export const makeGetMultipleNewAddressProofsV2 =
  (call: RpcCaller): GetMultipleNewAddressProofsV2Fn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsV2Request,
      GetMultipleNewAddressProofsV2Response
    >("getMultipleNewAddressProofsV2", params);
