import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleNewAddressProofsV2Request,
  GetMultipleNewAddressProofsV2Response,
} from "../types";

export type GetMultipleNewAddressProofsV2Fn = (
  p: GetMultipleNewAddressProofsV2Request
) => Promise<GetMultipleNewAddressProofsV2Response>;

export const makeGetMultipleNewAddressProofsV2 =
  (call: RpcCaller): GetMultipleNewAddressProofsV2Fn =>
  (params) =>
    call<
      GetMultipleNewAddressProofsV2Request,
      GetMultipleNewAddressProofsV2Response
    >("getMultipleNewAddressProofsV2", params);
