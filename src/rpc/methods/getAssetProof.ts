import { PendingRpcRequest } from "@solana/kit";
import { GetAssetProofRequest, GetAssetProofResponse } from "../../types";

export type GetAssetProofApi = {
    getAssetProof(params: GetAssetProofRequest): PendingRpcRequest<GetAssetProofResponse>;
};  