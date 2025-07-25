import type {
  GetAssetsByAuthorityRequest,
  GetAssetResponseList,
} from "../../types/das";
import type { RpcCaller } from "../caller";

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
