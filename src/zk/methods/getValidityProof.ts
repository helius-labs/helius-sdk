import { RpcCaller } from "../../rpc/caller.js";
import { GetValidityProofRequest, GetValidityProofResponse } from "../types.js";

export type GetValidityProofFn = (
  p: GetValidityProofRequest
) => Promise<GetValidityProofResponse>;

export const makeGetValidityProof =
  (call: RpcCaller): GetValidityProofFn =>
  (params) =>
    call<GetValidityProofRequest, GetValidityProofResponse>(
      "getValidityProof",
      params
    );
