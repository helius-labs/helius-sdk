import type {
  GetSignaturesForAssetRequest,
  GetSignaturesForAssetResponse,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetSignaturesForAssetFn = (
  p: GetSignaturesForAssetRequest
) => Promise<GetSignaturesForAssetResponse>;

export const makeGetSignaturesForAsset =
  (call: RpcCaller): GetSignaturesForAssetFn =>
  (params) =>
    call<GetSignaturesForAssetRequest, GetSignaturesForAssetResponse>(
      "getSignaturesForAsset",
      params
    );
