import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedTokenAccountsByDelegateFn,
  GetCompressedTokenAccountsByDelegateRequest as Req,
  GetCompressedTokenAccountsByDelegateResponse as Res,
} from "../types.js";

export const makeGetCompressedTokenAccountsByDelegate =
  (call: RpcCaller): GetCompressedTokenAccountsByDelegateFn =>
  (params) =>
    call<Req, Res>("getCompressedTokenAccountsByDelegate", params);
