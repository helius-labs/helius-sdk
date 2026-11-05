import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedTokenAccountBalanceFn,
  GetCompressedTokenAccountBalanceRequest as Req,
  GetCompressedTokenAccountBalanceResponse as Res,
} from "../types.js";

export const makeGetCompressedTokenAccountBalance =
  (call: RpcCaller): GetCompressedTokenAccountBalanceFn =>
  (params) =>
    call<Req, Res>("getCompressedTokenAccountBalance", params);
