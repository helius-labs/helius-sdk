import type { GetAssetRequest, GetAssetResponse } from "../../types";
import type { RpcCaller } from "../caller";

export type GetAssetFn = (p: GetAssetRequest) => Promise<GetAssetResponse>;

export const makeGetAsset =
  (call: RpcCaller): GetAssetFn =>
  (params) =>
    call<GetAssetRequest, GetAssetResponse>("getAsset", params);
