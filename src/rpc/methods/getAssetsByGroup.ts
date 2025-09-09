import type {
  AssetsByGroupRequest,
  GetAssetResponseList,
} from "../../types/das";
import type { RpcCaller } from "../caller";

export type GetAssetsByGroupFn = (
  p: AssetsByGroupRequest
) => Promise<GetAssetResponseList>;

export const makeGetAssetsByGroup =
  (call: RpcCaller): GetAssetsByGroupFn =>
  (params) =>
    call<AssetsByGroupRequest, GetAssetResponseList>(
      "getAssetsByGroup",
      params
    );
