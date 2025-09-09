import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedAccountsByOwnerFn,
  GetCompressedAccountsByOwnerRequest as Req,
  GetCompressedAccountsByOwnerResponse as Res,
} from "../types";

export const makeGetCompressedAccountsByOwner =
  (call: RpcCaller): GetCompressedAccountsByOwnerFn =>
  (params: Req) =>
    call<Req, Res>("getCompressedAccountsByOwner", params);
