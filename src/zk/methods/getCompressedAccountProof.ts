import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedAccountProofFn,
  GetCompressedAccountProofRequest,
  GetCompressedAccountProofResponse,
} from "../types";

export const makeGetCompressedAccountProof =
  (call: RpcCaller): GetCompressedAccountProofFn =>
  (params) =>
    call<GetCompressedAccountProofRequest, GetCompressedAccountProofResponse>(
      "getCompressedAccountProof",
      params
    );
