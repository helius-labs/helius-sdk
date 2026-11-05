import type { RpcCaller } from "../../rpc/caller.js";
import type {
  GetLatestNonVotingSignaturesFn,
  GetLatestNonVotingSignaturesRequest,
  GetLatestNonVotingSignaturesResponse,
} from "../types.js";

export const makeGetLatestNonVotingSignatures =
  (call: RpcCaller): GetLatestNonVotingSignaturesFn =>
  (params = {}) =>
    call<
      GetLatestNonVotingSignaturesRequest,
      GetLatestNonVotingSignaturesResponse
    >("getLatestNonVotingSignatures", params);
