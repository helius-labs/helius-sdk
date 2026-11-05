import type {
  GetNftEditionsRequest,
  GetNftEditionsResponse,
} from "../../types/das.js";
import type { RpcCaller } from "../caller.js";

export type GetNftEditionsFn = (
  p: GetNftEditionsRequest
) => Promise<GetNftEditionsResponse>;

export const makeGetNftEditions =
  (call: RpcCaller): GetNftEditionsFn =>
  (params) =>
    call<GetNftEditionsRequest, GetNftEditionsResponse>(
      "getNftEditions",
      params
    );
