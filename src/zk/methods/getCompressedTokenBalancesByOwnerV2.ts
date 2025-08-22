import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressedTokenBalancesByOwnerV2Fn,
  GetCompressedTokenBalancesByOwnerRequest,
  GetCompressedTokenBalancesByOwnerV2Response,
} from "../types";

export const makeGetCompressedTokenBalancesByOwnerV2 =
  (call: RpcCaller): GetCompressedTokenBalancesByOwnerV2Fn =>
  (params) =>
    call<
      GetCompressedTokenBalancesByOwnerRequest,
      GetCompressedTokenBalancesByOwnerV2Response
    >("getCompressedTokenBalancesByOwnerV2", params);
