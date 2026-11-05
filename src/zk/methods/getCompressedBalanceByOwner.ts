import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedBalanceByOwnerFn,
  GetCompressedBalanceByOwnerRequest as Req,
  GetCompressedBalanceByOwnerResponse as Res,
} from "../types.js";

export const makeGetCompressedBalanceByOwner =
  (call: RpcCaller): GetCompressedBalanceByOwnerFn =>
  (params) =>
    call<Req, Res>("getCompressedBalanceByOwner", params);
