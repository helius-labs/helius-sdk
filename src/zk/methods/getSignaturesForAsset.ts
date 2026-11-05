import { RpcCaller } from "../../rpc/caller.js";
import {
  GetSignaturesForAssetRequest,
  GetSignaturesForAssetResponse,
} from "../types.js";

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
