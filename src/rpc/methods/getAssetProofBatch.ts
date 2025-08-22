import type {
  GetAssetProofBatchRequest,
  GetAssetProofBatchResponse,
} from "../../types";
import type { RpcCaller } from "../caller";

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
