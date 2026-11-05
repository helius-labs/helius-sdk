import type {
  AssetsByOwnerRequest,
  GetAssetResponseList,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetsByOwnerFn = (
  p: AssetsByOwnerRequest
) => Promise<GetAssetResponseList>;

export const makeGetAssetsByOwner =
  (call: RpcCaller): GetAssetsByOwnerFn =>
  (params) =>
    call<AssetsByOwnerRequest, GetAssetResponseList>(
      "getAssetsByOwner",
      params
    );
