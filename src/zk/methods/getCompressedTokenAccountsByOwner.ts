import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetCompressedTokenAccountsByOwnerFn,
  GetCompressedTokenAccountsByOwnerRequest,
  GetCompressedTokenAccountsByOwnerResponse,
} from "../types.js";

export const makeGetCompressedTokenAccountsByOwner =
  (call: RpcCaller): GetCompressedTokenAccountsByOwnerFn =>
  (params) =>
    call<
      GetCompressedTokenAccountsByOwnerRequest,
      GetCompressedTokenAccountsByOwnerResponse
    >("getCompressedTokenAccountsByOwner", params);
