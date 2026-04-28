import type {
  GetTransfersByAddressConfig,
  GetTransfersByAddressResult,
} from "../../types";
import type { RpcCaller } from "../caller";

export type GetTransfersByAddressFn = (
  params: [string, GetTransfersByAddressConfig?]
) => Promise<GetTransfersByAddressResult>;

export const makeGetTransfersByAddress =
  (call: RpcCaller): GetTransfersByAddressFn =>
  (params) =>
    call<[string, GetTransfersByAddressConfig?], GetTransfersByAddressResult>(
      "getTransfersByAddress",
      params
    );
