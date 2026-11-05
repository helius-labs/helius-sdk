import type {
  GetAssetsByAuthorityRequest,
  GetAssetResponseList,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetsByAuthorityFn = (
  p: GetAssetsByAuthorityRequest
) => Promise<GetAssetResponseList>;

export const makeGetAssetsByAuthority =
  (call: RpcCaller): GetAssetsByAuthorityFn =>
  (params) =>
    call<GetAssetsByAuthorityRequest, GetAssetResponseList>(
      "getAssetsByAuthority",
      params
    );
