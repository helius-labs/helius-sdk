import type { RpcCaller } from "../caller";
import {
  type GetTokenAccountsByOwnerV2Config,
  type GetTokenAccountsByOwnerV2Request,
  type GetTokenAccountsByOwnerV2Response,
  type GtaV2Account,
} from "../../types";
import { makeGetTokenAccountsByOwnerV2 } from "./getTokenAccountsByOwnerV2";

export type GetAllTokenAccountsByOwnerFn = (
  owner: string,
  filter?: GetTokenAccountsByOwnerV2Request[1],
  options?: Omit<GetTokenAccountsByOwnerV2Config, "paginationKey" | "limit">
) => Promise<ReadonlyArray<GtaV2Account>>;

export const makeGetAllTokenAccountsByOwner =
  (call: RpcCaller): GetAllTokenAccountsByOwnerFn =>
  async (owner, filter = {}, options = {}) => {
    const getPage = makeGetTokenAccountsByOwnerV2(call);
    const out: GtaV2Account[] = [];
    let paginationKey: string | null = null;

    do {
      const res: GetTokenAccountsByOwnerV2Response = await getPage([
        owner,
        filter,
        {
          ...options,
          limit: 10_000,
          ...(paginationKey ? { paginationKey } : {}),
        },
      ]);

      // By default `value` is the accounts array with `paginationKey` beside
      // it; `withContext: true` nests both under `value` instead
      const raw = res as any;
      const page = Array.isArray(raw?.value)
        ? { accounts: raw.value, paginationKey: raw.paginationKey }
        : (raw?.value ?? raw);
      out.push(...page.accounts);
      paginationKey = page.paginationKey;
    } while (paginationKey);

    return out;
  };
