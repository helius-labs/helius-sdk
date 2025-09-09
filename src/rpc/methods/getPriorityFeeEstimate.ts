import type {
  GetPriorityFeeEstimateRequest,
  GetPriorityFeeEstimateResponse,
} from "../../types";
import type { RpcCaller } from "../caller";

export type GetPriorityFeeEstimateFn = (
  p: GetPriorityFeeEstimateRequest
) => Promise<GetPriorityFeeEstimateResponse>;

export const makeGetPriorityFeeEstimate =
  (call: RpcCaller): GetPriorityFeeEstimateFn =>
  (params) =>
    call<[GetPriorityFeeEstimateRequest], GetPriorityFeeEstimateResponse>(
      "getPriorityFeeEstimate",
      // Need to wrap the params in an array
      [params]
    );
