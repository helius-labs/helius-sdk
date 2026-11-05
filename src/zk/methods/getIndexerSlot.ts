import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetIndexerSlotFn,
  GetIndexerSlotRequest,
  GetIndexerSlotResponse,
} from "../types.js";

export const makeGetIndexerSlot =
  (call: RpcCaller): GetIndexerSlotFn =>
  () =>
    call<GetIndexerSlotRequest, GetIndexerSlotResponse>(
      "getIndexerSlot",
      {} as const
    );
