import type { CheckoutStatusResponse } from "./types.js";
import { authRequest } from "./utils.js";

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
