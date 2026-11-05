import { RpcCaller } from "../../rpc/caller.js";
import {
  GetCompressedAccountProofFn,
  GetCompressedAccountProofRequest,
  GetCompressedAccountProofResponse,
} from "../types.js";

export const makeGetCompressedAccountProof =
  (call: RpcCaller): GetCompressedAccountProofFn =>
  (params) =>
    call<GetCompressedAccountProofRequest, GetCompressedAccountProofResponse>(
      "getCompressedAccountProof",
      params
    );
