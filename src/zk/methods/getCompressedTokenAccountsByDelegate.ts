import { RpcCaller } from "../../rpc/caller";
import {
    GetCompressedTokenAccountsByDelegateFn,
  GetCompressedTokenAccountsByDelegateRequest as Req,
  GetCompressedTokenAccountsByDelegateResponse as Res,
} from "../types";

export const makeGetCompressedTokenAccountsByDelegate =
  (call: RpcCaller): GetCompressedTokenAccountsByDelegateFn =>
  (params) =>
    call<Req, Res>("getCompressedTokenAccountsByDelegate", params);
