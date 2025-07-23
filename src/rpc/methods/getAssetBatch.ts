import { PendingRpcRequest } from "@solana/kit";
import { GetAssetBatchRequest, GetAssetBatchResponse } from "../../types";

export type GetAssetBatchApi = {
    getAssetBatch(params: GetAssetBatchRequest): PendingRpcRequest<GetAssetBatchResponse>;
};  