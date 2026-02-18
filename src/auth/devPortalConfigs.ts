import { authRequest } from "./utils";

interface DevPortalConfigsResponse {
  openPay: {
    priceIds: {
      Monthly: Record<string, string>;
      Yearly: Record<string, string>;
    };
  };
}

export async function fetchOpenPayPriceIds(
  jwt: string,
  userAgent?: string,
): Promise<{ Monthly: Record<string, string>; Yearly: Record<string, string> }> {
  const configs = await authRequest<DevPortalConfigsResponse>(
    "/dev-portal/configs",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent,
  );
  return configs.openPay.priceIds;
}
