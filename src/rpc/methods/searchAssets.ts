import type { RpcCaller } from "../caller";
import type {
  SearchAssetsRequest,
  GetAssetResponseList,
} from "../../types/das";

export type SearchAssetsFn = (
  p: SearchAssetsRequest
) => Promise<GetAssetResponseList>;

export const makeSearchAssets =
  (call: RpcCaller): SearchAssetsFn =>
  (params) =>
    call<SearchAssetsRequest, GetAssetResponseList>("searchAssets", params);
