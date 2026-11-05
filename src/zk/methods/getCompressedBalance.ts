import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedBalanceFn,
  GetCompressedBalanceRequest as Req,
  GetCompressedBalanceResponse as Res,
} from "../types.js";

export const makeGetCompressedBalance =
  (call: RpcCaller): GetCompressedBalanceFn =>
  (params) =>
    call<Req, Res>("getCompressedBalance", params);
