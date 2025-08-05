import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedAccountsByOwnerRequest as Req,
  GetCompressedAccountsByOwnerResponse as Res,
} from "../types";

export type GetCompressedAccountsByOwnerFn = (p: Req) => Promise<Res>;

export const makeGetCompressedAccountsByOwner =
  (call: RpcCaller): GetCompressedAccountsByOwnerFn =>
  (params) =>
    call<Req, Res>("getCompressedAccountsByOwner", params);
