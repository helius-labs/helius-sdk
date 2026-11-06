import type {
  GetProgramAccountsV2Request,
  GetProgramAccountsV2Response,
} from "../../types/index.js";
import type { RpcCaller } from "../caller.js";

export type GetProgramAccountsV2Fn = (
  p: GetProgramAccountsV2Request
) => Promise<GetProgramAccountsV2Response>;

export const makeGetProgramAccountsV2 =
  (call: RpcCaller): GetProgramAccountsV2Fn =>
  (params) =>
    call<GetProgramAccountsV2Request, GetProgramAccountsV2Response>(
      "getProgramAccountsV2",
      params
    );
