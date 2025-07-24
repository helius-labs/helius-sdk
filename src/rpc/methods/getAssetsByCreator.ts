import { PendingRpcRequest } from "@solana/kit";
import { AssetsByCreatorRequest, GetAssetResponseList } from "../../types/das";

export type GetAssetsByCreatorApi = {
    getAssetsByCreator(params: AssetsByCreatorRequest): PendingRpcRequest<GetAssetResponseList>;
};  
