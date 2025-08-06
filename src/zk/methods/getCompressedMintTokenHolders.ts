import { RpcCaller } from "../../rpc/caller";
import {
    GetCompressedMintTokenHoldersFn,
  GetCompressedMintTokenHoldersRequest as Req,
  GetCompressedMintTokenHoldersResponse as Res,
} from "../types";

export const makeGetCompressedMintTokenHolders =
  (call: RpcCaller): GetCompressedMintTokenHoldersFn =>
  (params) =>
    call<Req, Res>("getCompressedMintTokenHolders", params);
