import type {
  GetAssetProofBatchRequest,
  GetAssetProofBatchResponse,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetProofBatchFn = (
  p: GetAssetProofBatchRequest
) => Promise<GetAssetProofBatchResponse>;

export const makeGetAssetProofBatch =
  (call: RpcCaller): GetAssetProofBatchFn =>
  (params) =>
    call<GetAssetProofBatchRequest, GetAssetProofBatchResponse>(
      "getAssetProofBatch",
      params
    );
