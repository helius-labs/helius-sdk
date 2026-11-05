import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetMultipleCompressedAccountProofsFn,
  GetMultipleCompressedAccountProofsRequest,
  GetMultipleCompressedAccountProofsResponse,
} from "../types.js";

export const makeGetMultipleCompressedAccountProofs =
  (call: RpcCaller): GetMultipleCompressedAccountProofsFn =>
  (hashes) =>
    call<
      GetMultipleCompressedAccountProofsRequest,
      GetMultipleCompressedAccountProofsResponse
    >("getMultipleCompressedAccountProofs", hashes);
