import type { RpcCaller } from "../caller";
import {
  type GetProgramAccountsV2Config,
  type GetProgramAccountsV2Response,
  type GpaV2Account,
} from "../../types";
import { makeGetProgramAccountsV2 } from "./getProgramAccountsV2";

export type GetAllProgramAccountsFn = (
  programId: string,
  options?: Omit<GetProgramAccountsV2Config, "paginationKey" | "limit">
) => Promise<ReadonlyArray<GpaV2Account>>;

export const makeGetAllProgramAccounts =
  (call: RpcCaller): GetAllProgramAccountsFn =>
  async (programId, options = {}) => {
    const getPage = makeGetProgramAccountsV2(call);

    const results: GpaV2Account[] = [];
    let paginationKey: string | null = null;

    do {
      const res: GetProgramAccountsV2Response = await getPage([
        programId,
        {
          ...options,
          limit: 10_000,
          ...(paginationKey ? { paginationKey } : {}),
        } as GetProgramAccountsV2Config,
      ]);

      // Unwrap RpcResponse<T> if withContext = true
      const page = (res as any)?.value ?? (res as any);

      results.push(...page.accounts);
      paginationKey = page.paginationKey;
    } while (paginationKey);

    return results;
  };
