import type { RpcCaller } from "../../rpc/caller";
import type {
  GetMultipleCompressedAccountProofsFn,
  GetMultipleCompressedAccountProofsRequest,
  GetMultipleCompressedAccountProofsResponse,
} from "../types";

/** Fetch proofs for many compressed‑account hashes in one RPC. */
export const makeGetMultipleCompressedAccountProofs =
  (call: RpcCaller): GetMultipleCompressedAccountProofsFn =>
  (hashes) =>
    call<
      GetMultipleCompressedAccountProofsRequest,
      GetMultipleCompressedAccountProofsResponse
    >("getMultipleCompressedAccountProofs", hashes);
