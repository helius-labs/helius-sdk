import { authRequest } from "./utils";

interface DevPortalConfigsResponse {
  stripe: {
    priceIds: {
      Monthly: Record<string, string>;
      Yearly: Record<string, string>;
    };
  };
  // Keep openPay as optional for backwards compat during transition
  openPay?: {
    priceIds: {
      Monthly: Record<string, string>;
      Yearly: Record<string, string>;
    };
  };
}

export async function fetchStripePriceIds(
  jwt: string,
  userAgent?: string
): Promise<{
  Monthly: Record<string, string>;
  Yearly: Record<string, string>;
}> {
  const configs = await authRequest<DevPortalConfigsResponse>(
    "/dev-portal/configs",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent
  );
  return configs.stripe.priceIds;
}

/** @deprecated Use fetchStripePriceIds instead */
export const fetchOpenPayPriceIds = fetchStripePriceIds;
