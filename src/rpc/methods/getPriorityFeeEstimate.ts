import { PendingRpcRequest } from "@solana/kit";
import { GetPriorityFeeEstimateRequest, GetPriorityFeeEstimateResponse } from "../../types";

export type GetPriorityFeeEstimateApi = {
  getPriorityFeeEstimate(params: GetPriorityFeeEstimateRequest): PendingRpcRequest<GetPriorityFeeEstimateResponse>;
};