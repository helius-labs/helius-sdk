import type {
  GetAssetProofRequest,
  GetAssetProofResponse,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetAssetProofFn = (
  p: GetAssetProofRequest
) => Promise<GetAssetProofResponse>;

export const makeGetAssetProof =
  (call: RpcCaller): GetAssetProofFn =>
  (params) =>
    call<GetAssetProofRequest, GetAssetProofResponse>("getAssetProof", params);
