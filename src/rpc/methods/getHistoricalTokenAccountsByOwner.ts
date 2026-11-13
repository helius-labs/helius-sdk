import type {
  GetHistoricalTokenAccountsByOwnerConfig,
  GetHistoricalTokenAccountsByOwnerRequest,
  GetHistoricalTokenAccountsByOwnerResponse,
  HistoricalAccountQuery,
  HistoricalEncodedAccountData,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetHistoricalTokenAccountsByOwnerFn = {
  (
    params: [
      string,
      HistoricalAccountQuery?,
      (GetHistoricalTokenAccountsByOwnerConfig & {
        encoding?: "base64" | "base64+zstd";
      })?,
    ]
  ): Promise<
    GetHistoricalTokenAccountsByOwnerResponse<HistoricalEncodedAccountData>
  >;
  (
    params: GetHistoricalTokenAccountsByOwnerRequest
  ): Promise<GetHistoricalTokenAccountsByOwnerResponse>;
};

export const makeGetHistoricalTokenAccountsByOwner = (
  call: RpcCaller
): GetHistoricalTokenAccountsByOwnerFn =>
  (([owner, query, config]: GetHistoricalTokenAccountsByOwnerRequest) =>
    // Omitted slots would serialize as null
    call("getHistoricalTokenAccountsByOwner", [
      owner,
      query ?? {},
      config ?? {},
    ])) as GetHistoricalTokenAccountsByOwnerFn;
