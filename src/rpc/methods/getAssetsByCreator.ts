import type {
  AssetsByCreatorRequest,
  GetAssetResponseList,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetsByCreatorFn = (
  p: AssetsByCreatorRequest
) => Promise<GetAssetResponseList>;

export const makeGetAssetsByCreator =
  (call: RpcCaller): GetAssetsByCreatorFn =>
  (params) =>
    call<AssetsByCreatorRequest, GetAssetResponseList>(
      "getAssetsByCreator",
      params
    );
