import type {
  GetTokenAccountsByOwnerV2Config,
  GetTokenAccountsByOwnerV2ContextResponse,
  GetTokenAccountsByOwnerV2DirectResponse,
  GetTokenAccountsByOwnerV2Filter,
  GetTokenAccountsByOwnerV2Request,
  GetTokenAccountsByOwnerV2Response,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetTokenAccountsByOwnerV2Fn = {
  (
    params: [
      string,
      GetTokenAccountsByOwnerV2Filter | undefined,
      GetTokenAccountsByOwnerV2Config & { withContext: true },
    ]
  ): Promise<GetTokenAccountsByOwnerV2ContextResponse>;
  (
    params: [
      string,
      GetTokenAccountsByOwnerV2Filter?,
      (GetTokenAccountsByOwnerV2Config & { withContext?: false })?,
    ]
  ): Promise<GetTokenAccountsByOwnerV2DirectResponse>;
  (
    params: GetTokenAccountsByOwnerV2Request
  ): Promise<GetTokenAccountsByOwnerV2Response>;
};

export const makeGetTokenAccountsByOwnerV2 = (
  call: RpcCaller
): GetTokenAccountsByOwnerV2Fn =>
  ((params: GetTokenAccountsByOwnerV2Request) =>
    call<GetTokenAccountsByOwnerV2Request, GetTokenAccountsByOwnerV2Response>(
      "getTokenAccountsByOwnerV2",
      params
    )) as GetTokenAccountsByOwnerV2Fn;
