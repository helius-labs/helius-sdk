import type {
  AssetsByCreatorRequest,
  GetAssetResponseList,
} from "../../types/das";
import type { RpcCaller } from "../caller";

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
