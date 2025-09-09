import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleNewAddressProofsV2Fn,
  GetMultipleNewAddressProofsV2Request,
  GetMultipleNewAddressProofsV2Response,
} from "../types";

export const makeGetMultipleNewAddressProofsV2 =
  (call: RpcCaller): GetMultipleNewAddressProofsV2Fn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsV2Request,
      GetMultipleNewAddressProofsV2Response
    >("getMultipleNewAddressProofsV2", params);
