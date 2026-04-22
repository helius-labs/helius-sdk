import { authRequest } from "./utils";

/**
 * Response shape of `GET /dev-portal/configs`, mirroring the monorepo's
 * `DevPortalConfigsResponse` (`ts-services/dev-api-lambda/model/pricing-products.ts`).
 *
 * Only the fields the SDK actively reads are strongly typed; other sections
 * (sphere, loop, openPay) still appear in the live response but are
 * vestigial after the backend's OpenPay → Stripe migration. The SDK should
 * always read plan pricing from `stripe.priceIds`.
 */
export interface DevPortalConfigsResponse {
  stripe: {
    priceIds: {
      Monthly: Record<string, string>;
      Yearly: Record<string, string>;
      /** Present only when the request was made with `?agent=cli`. */
      AgentPlan?: string;
    };
    prepaidCreditsPlans?: Record<string, string>;
  };
  /**
   * Deprecated. The backend still returns this section for transitional
   * compatibility but the OpenPay billing handler has been deleted and
   * `openpay.service.ts` is stubbed. Prefer `stripe.priceIds`.
   */
  openPay?: {
    priceIds: {
      Monthly: Record<string, string>;
      Yearly: Record<string, string>;
    };
  };
}

/**
 * Fetch the raw dev-portal configs response.
 *
 * When `options.includeAgentPlan === true`, the `?agent=cli` query param is
 * appended so the backend includes `stripe.priceIds.AgentPlan`. Without it,
 * the Agent Plan priceId is omitted from the response.
 */
export async function fetchDevPortalConfigs(
  jwt: string,
  options?: { includeAgentPlan?: boolean },
  userAgent?: string
): Promise<DevPortalConfigsResponse> {
  const path = options?.includeAgentPlan
    ? "/dev-portal/configs?agent=cli"
    : "/dev-portal/configs";
  return authRequest<DevPortalConfigsResponse>(
    path,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent
  );
}

/**
 * Fetch the Stripe priceIds block from `/dev-portal/configs`.
 *
 * Returns `{ Monthly, Yearly, AgentPlan? }`. `AgentPlan` is only present
 * when `options.includeAgentPlan === true`. This is the canonical source
 * of plan price IDs for the SDK post-OpenPay migration.
 */
export async function fetchStripePriceIds(
  jwt: string,
  options?: { includeAgentPlan?: boolean },
  userAgent?: string
): Promise<DevPortalConfigsResponse["stripe"]["priceIds"]> {
  const configs = await fetchDevPortalConfigs(jwt, options, userAgent);
  return configs.stripe.priceIds;
}

/**
 * Fetch the prepaid-credits price-lookup map from `/dev-portal/configs`.
 *
 * Returns a flat `Record<string, string>` keyed by lookup keys like
 * `prepaid_credits_10_USDC` → Stripe price ID. Each unit of `qty` grants
 * 1,000,000 credits at the backend (see
 * `ts-services/dev-api-lambda/util/constant.ts` `PREPAID_CREDITS_PER_UNIT_QTY`).
 */
export async function fetchPrepaidCreditsPriceIds(
  jwt: string,
  userAgent?: string
): Promise<Record<string, string>> {
  const configs = await fetchDevPortalConfigs(jwt, undefined, userAgent);
  return configs.stripe.prepaidCreditsPlans ?? {};
}

/**
 * @deprecated Prefer `fetchStripePriceIds` or `fetchDevPortalConfigs`.
 * Kept for backwards compatibility with existing SDK consumers. The
 * backend's `openPay` response key is vestigial after the Stripe cutover;
 * this helper now reads from `stripe.priceIds` under the hood so it keeps
 * working, but the name is misleading and will be removed in a future
 * major.
 */
export async function fetchOpenPayPriceIds(
  jwt: string,
  userAgent?: string
): Promise<{
  Monthly: Record<string, string>;
  Yearly: Record<string, string>;
}> {
  const priceIds = await fetchStripePriceIds(jwt, undefined, userAgent);
  return { Monthly: priceIds.Monthly, Yearly: priceIds.Yearly };
}
