import type {
  GetTransactionsForAddressRequest,
  GetTransactionsForAddressResponse,
} from "../../types";
import type { RpcCaller } from "../caller";

export type GetTransactionsForAddressFn = (
  p: GetTransactionsForAddressRequest
) => Promise<GetTransactionsForAddressResponse>;

export const makeGetTransactionsForAddress =
  (call: RpcCaller): GetTransactionsForAddressFn =>
  (params) =>
    call<GetTransactionsForAddressRequest, GetTransactionsForAddressResponse>(
      "getTransactionsForAddress",
      params
    );
