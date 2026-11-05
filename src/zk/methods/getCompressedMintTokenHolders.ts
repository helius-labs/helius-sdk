import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedMintTokenHoldersFn,
  GetCompressedMintTokenHoldersRequest as Req,
  GetCompressedMintTokenHoldersResponse as Res,
} from "../types.js";

export const makeGetCompressedMintTokenHolders =
  (call: RpcCaller): GetCompressedMintTokenHoldersFn =>
  (params) =>
    call<Req, Res>("getCompressedMintTokenHolders", params);
