import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressedTokenBalancesByOwnerV2Fn,
  GetCompressedTokenBalancesByOwnerRequest,
  GetCompressedTokenBalancesByOwnerV2Response,
} from "../types.js";

export const makeGetCompressedTokenBalancesByOwnerV2 =
  (call: RpcCaller): GetCompressedTokenBalancesByOwnerV2Fn =>
  (params) =>
    call<
      GetCompressedTokenBalancesByOwnerRequest,
      GetCompressedTokenBalancesByOwnerV2Response
    >("getCompressedTokenBalancesByOwnerV2", params);
