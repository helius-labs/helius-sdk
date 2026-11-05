import type {
  GetAssetBatchRequest,
  GetAssetBatchResponse,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetBatchFn = (
  p: GetAssetBatchRequest
) => Promise<GetAssetBatchResponse>;

export const makeGetAssetBatch =
  (call: RpcCaller): GetAssetBatchFn =>
  (params) =>
    call<GetAssetBatchRequest, GetAssetBatchResponse>("getAssetBatch", params);
