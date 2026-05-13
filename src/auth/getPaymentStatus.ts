import type { CheckoutStatusResponse } from "./types";
import { authRequest } from "./utils";

export async function getPaymentStatus(
  jwt: string,
  paymentIntentId: string,
  userAgent?: string
): Promise<CheckoutStatusResponse> {
  return authRequest<CheckoutStatusResponse>(
    `/checkout/${paymentIntentId}/status`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent
  );
}
