import type { GetAssetProofRequest, GetAssetProofResponse } from "../../types";
import type { RpcCaller } from "../caller";

export type GetAssetProofFn = (
  p: GetAssetProofRequest
) => Promise<GetAssetProofResponse>;

export const makeGetAssetProof =
  (call: RpcCaller): GetAssetProofFn =>
  (params) =>
    call<GetAssetProofRequest, GetAssetProofResponse>("getAssetProof", params);
