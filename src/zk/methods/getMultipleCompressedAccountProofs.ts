import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleCompressedAccountProofsFn,
  GetMultipleCompressedAccountProofsRequest,
  GetMultipleCompressedAccountProofsResponse,
} from "../types";

export const makeGetMultipleCompressedAccountProofs =
  (call: RpcCaller): GetMultipleCompressedAccountProofsFn =>
  (hashes) =>
    call<
      GetMultipleCompressedAccountProofsRequest,
      GetMultipleCompressedAccountProofsResponse
    >("getMultipleCompressedAccountProofs", hashes);
