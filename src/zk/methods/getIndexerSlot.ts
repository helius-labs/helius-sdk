import type { RpcCaller } from "../../rpc/caller";
import type {
  GetIndexerSlotFn,
  GetIndexerSlotRequest,
  GetIndexerSlotResponse,
} from "../types";

export const makeGetIndexerSlot =
  (call: RpcCaller): GetIndexerSlotFn =>
  () =>
    call<GetIndexerSlotRequest, GetIndexerSlotResponse>(
      "getIndexerSlot",
      {} as const
    );
