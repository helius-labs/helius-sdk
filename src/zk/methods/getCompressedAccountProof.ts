import { RpcCaller } from "../../rpc/caller";
import {
  GetCompressedAccountProofRequest,
  GetCompressedAccountProofResponse,
} from "../types";

export type GetCompressedAccountProofFn = (
  p: GetCompressedAccountProofRequest
) => Promise<GetCompressedAccountProofResponse>;

export const makeGetCompressedAccountProof =
  (call: RpcCaller): GetCompressedAccountProofFn =>
  (params) =>
    call<GetCompressedAccountProofRequest, GetCompressedAccountProofResponse>(
      "getCompressedAccountProof",
      params
    );
