import { PendingRpcRequest } from "@solana/kit";
import { GetAssetRequest, GetAssetResponse } from "../../types";

export type GetAssetApi = {
    getAsset(params: GetAssetRequest): PendingRpcRequest<GetAssetResponse>;
};  