import { PendingRpcRequest } from "@solana/kit";
import { AssetsByGroupRequest, GetAssetResponseList } from "../../types/das";

export type GetAssetsByGroupApi = {
    getAssetsByGroup(params: AssetsByGroupRequest): PendingRpcRequest<GetAssetResponseList>;
};  
