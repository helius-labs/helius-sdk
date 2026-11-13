import type {
  GetHistoricalAccountInfoConfig,
  GetHistoricalAccountInfoRequest,
  GetHistoricalAccountInfoResponse,
  HistoricalAccountQuery,
  HistoricalEncodedAccountData,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetHistoricalAccountInfoFn = {
  (
    params: [
      string,
      HistoricalAccountQuery?,
      (GetHistoricalAccountInfoConfig & {
        encoding?: "base64" | "base64+zstd";
      })?,
    ]
  ): Promise<GetHistoricalAccountInfoResponse<HistoricalEncodedAccountData>>;
  (
    params: GetHistoricalAccountInfoRequest
  ): Promise<GetHistoricalAccountInfoResponse>;
};

export const makeGetHistoricalAccountInfo = (
  call: RpcCaller
): GetHistoricalAccountInfoFn =>
  (([address, query, config]: GetHistoricalAccountInfoRequest) =>
    // Omitted slots would serialize as null
    call("getHistoricalAccountInfo", [
      address,
      query ?? {},
      config ?? {},
    ])) as GetHistoricalAccountInfoFn;
