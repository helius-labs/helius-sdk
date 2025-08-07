import { RpcCaller } from "../../rpc/caller";
import {
  GetSignaturesForAssetRequest,
  GetSignaturesForAssetResponse,
} from "../types";

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
