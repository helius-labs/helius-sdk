import type { RpcCaller } from "../../rpc/caller";
import type {
  GetIndexerHealthFn,
  GetIndexerHealthResponse,
  GetIndexerHealthRequest,
} from "../types";

export const makeGetIndexerHealth =
  (call: RpcCaller): GetIndexerHealthFn =>
  () =>
    call<GetIndexerHealthRequest, GetIndexerHealthResponse>(
      "getIndexerHealth",
      {} as const
    );
