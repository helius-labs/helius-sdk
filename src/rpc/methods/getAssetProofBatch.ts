import { PendingRpcRequest } from "@solana/kit";
import { GetAssetProofBatchRequest, GetAssetProofBatchResponse } from "../../types";

export type GetAssetProofBatchApi = {
    getAssetProofBatch(params: GetAssetProofBatchRequest): PendingRpcRequest<GetAssetProofBatchResponse>;
};  