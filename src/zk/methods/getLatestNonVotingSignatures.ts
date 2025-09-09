import type { RpcCaller } from "../../rpc/caller";
import type {
  GetLatestNonVotingSignaturesFn,
  GetLatestNonVotingSignaturesRequest,
  GetLatestNonVotingSignaturesResponse,
} from "../types";

export const makeGetLatestNonVotingSignatures =
  (call: RpcCaller): GetLatestNonVotingSignaturesFn =>
  (params = {}) =>
    call<
      GetLatestNonVotingSignaturesRequest,
      GetLatestNonVotingSignaturesResponse
    >("getLatestNonVotingSignatures", params);
