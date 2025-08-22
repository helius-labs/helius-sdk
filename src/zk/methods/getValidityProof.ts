import { RpcCaller } from "../../rpc/caller";
import { GetValidityProofRequest, GetValidityProofResponse } from "../types";

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
