import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedBalanceFn,
  GetCompressedBalanceRequest as Req,
  GetCompressedBalanceResponse as Res,
} from "../types";

export const makeGetCompressedBalance =
  (call: RpcCaller): GetCompressedBalanceFn =>
  (params) =>
    call<Req, Res>("getCompressedBalance", params);
