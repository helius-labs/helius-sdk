import { PendingRpcRequest } from "@solana/kit";
import { GetAssetResponseList, GetAssetsByAuthorityRequest } from "../../types/das";

export type GetAssetsByAuthorityApi = {
    getAssetsByAuthority(params: GetAssetsByAuthorityRequest): PendingRpcRequest<GetAssetResponseList>;
};  