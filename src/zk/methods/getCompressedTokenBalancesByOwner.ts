import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressedTokenBalancesByOwnerFn,
  GetCompressedTokenBalancesByOwnerRequest,
  GetCompressedTokenBalancesByOwnerResponse,
} from "../types.js";

export const makeGetCompressedTokenBalancesByOwner =
  (call: RpcCaller): GetCompressedTokenBalancesByOwnerFn =>
  (params) =>
    call<
      GetCompressedTokenBalancesByOwnerRequest,
      GetCompressedTokenBalancesByOwnerResponse
    >("getCompressedTokenBalancesByOwner", params);
