import type {
  GetTokenAccountsRequest,
  GetTokenAccountsResponse,
} from "../../types/das";
import type { RpcCaller } from "../caller";

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
