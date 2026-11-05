import type { GetAssetRequest, GetAssetResponse } from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetFn = (p: GetAssetRequest) => Promise<GetAssetResponse>;

export const makeGetAsset =
  (call: RpcCaller): GetAssetFn =>
  (params) =>
    call<GetAssetRequest, GetAssetResponse>("getAsset", params);
