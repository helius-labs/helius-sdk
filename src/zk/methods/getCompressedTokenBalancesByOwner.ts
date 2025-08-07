import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressedTokenBalancesByOwnerFn,
  GetCompressedTokenBalancesByOwnerRequest,
  GetCompressedTokenBalancesByOwnerResponse,
} from "../types";

export const makeGetCompressedTokenBalancesByOwner =
  (call: RpcCaller): GetCompressedTokenBalancesByOwnerFn =>
  (params) =>
    call<
      GetCompressedTokenBalancesByOwnerRequest,
      GetCompressedTokenBalancesByOwnerResponse
    >("getCompressedTokenBalancesByOwner", params);
