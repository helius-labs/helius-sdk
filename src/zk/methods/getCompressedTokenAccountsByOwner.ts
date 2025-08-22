import type { RpcCaller } from "../../rpc/caller";
import type {
  GetCompressedTokenAccountsByOwnerFn,
  GetCompressedTokenAccountsByOwnerRequest,
  GetCompressedTokenAccountsByOwnerResponse,
} from "../types";

export const makeGetCompressedTokenAccountsByOwner =
  (call: RpcCaller): GetCompressedTokenAccountsByOwnerFn =>
  (params) =>
    call<
      GetCompressedTokenAccountsByOwnerRequest,
      GetCompressedTokenAccountsByOwnerResponse
    >("getCompressedTokenAccountsByOwner", params);
