import { RpcCaller } from "../../rpc/caller";
import {
    GetCompressedTokenAccountBalanceFn,
  GetCompressedTokenAccountBalanceRequest as Req,
  GetCompressedTokenAccountBalanceResponse as Res,
} from "../types";

export const makeGetCompressedTokenAccountBalance =
  (call: RpcCaller): GetCompressedTokenAccountBalanceFn =>
  (params) =>
    call<Req, Res>("getCompressedTokenAccountBalance", params);
