import type {
  GetSignaturesForAssetRequest,
  GetSignaturesForAssetResponse,
} from "../../types/das";
import type { RpcCaller } from "../caller";

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
