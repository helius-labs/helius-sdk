import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetIndexerHealthFn,
  GetIndexerHealthResponse,
  GetIndexerHealthRequest,
} from "../types.js";

export const makeGetIndexerHealth =
  (call: RpcCaller): GetIndexerHealthFn =>
  () =>
    call<GetIndexerHealthRequest, GetIndexerHealthResponse>(
      "getIndexerHealth",
      {} as const
    );
