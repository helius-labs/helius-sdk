import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedAccountsByOwnerFn,
  GetCompressedAccountsByOwnerRequest as Req,
  GetCompressedAccountsByOwnerResponse as Res,
} from "../types.js";

export const makeGetCompressedAccountsByOwner =
  (call: RpcCaller): GetCompressedAccountsByOwnerFn =>
  (params: Req) =>
    call<Req, Res>("getCompressedAccountsByOwner", params);
