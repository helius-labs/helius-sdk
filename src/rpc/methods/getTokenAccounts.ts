import type {
  GetTokenAccountsRequest,
  GetTokenAccountsResponse,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetTokenAccountsFn = (
  p: GetTokenAccountsRequest
) => Promise<GetTokenAccountsResponse>;

export const makeGetTokenAccounts =
  (call: RpcCaller): GetTokenAccountsFn =>
  (params) =>
    call<GetTokenAccountsRequest, GetTokenAccountsResponse>(
      "getTokenAccounts",
      params
    );
