import type {
  GetTokenAccountsByOwnerV2Request,
  GetTokenAccountsByOwnerV2Response,
} from "../../types";
import type { RpcCaller } from "../caller";

export type GetTokenAccountsByOwnerV2Fn = (
  p: GetTokenAccountsByOwnerV2Request
) => Promise<GetTokenAccountsByOwnerV2Response>;

export const makeGetTokenAccountsByOwnerV2 =
  (call: RpcCaller): GetTokenAccountsByOwnerV2Fn =>
  (params) =>
    call<
      GetTokenAccountsByOwnerV2Request,
      GetTokenAccountsByOwnerV2Response
    >("getTokenAccountsByOwnerV2", params);
