import type { GetAssetBatchRequest, GetAssetBatchResponse } from "../../types";
import type { RpcCaller } from "../caller";

export type GetAssetBatchFn = (
  p: GetAssetBatchRequest
) => Promise<GetAssetBatchResponse>;

export const makeGetAssetBatch =
  (call: RpcCaller): GetAssetBatchFn =>
  (params) =>
    call<GetAssetBatchRequest, GetAssetBatchResponse>("getAssetBatch", params);
