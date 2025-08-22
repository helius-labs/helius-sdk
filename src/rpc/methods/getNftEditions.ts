import type {
  GetNftEditionsRequest,
  GetNftEditionsResponse,
} from "../../types/das";
import type { RpcCaller } from "../caller";

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
