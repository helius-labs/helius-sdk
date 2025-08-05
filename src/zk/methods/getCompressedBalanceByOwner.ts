import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedBalanceByOwnerFn,
  GetCompressedBalanceByOwnerRequest as Req,
  GetCompressedBalanceByOwnerResponse as Res,
} from "../types";

export const makeGetCompressedBalanceByOwner =
  (call: RpcCaller): GetCompressedBalanceByOwnerFn =>
  (params) =>
    call<Req, Res>("getCompressedBalanceByOwner", params);
