import {
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
} from "./constants.js";
import { getPaymentStatus } from "./getPaymentStatus.js";
import { getHttpStatus } from "./getHttpStatus.js";
import { sleep } from "./utils.js";
import type { CheckoutStatusResponse } from "./types.js";

export type PollOutcome =
  | { kind: "completed"; status: CheckoutStatusResponse }
  | { kind: "expired"; status?: CheckoutStatusResponse }
  | { kind: "failed"; status: CheckoutStatusResponse }
  | { kind: "timeout" };

/**
 * Poll authenticated `getPaymentStatus` until a terminal outcome or timeout.
 *
 * Terminal outcomes:
 * - `completed` — `readyToRedirect: true`
 * - `expired`   — `phase === "expired"` or HTTP 410 from the status endpoint
 * - `failed`    — `phase === "failed"`
 * - `timeout`   — deadline elapsed without a terminal phase
 *
 * The 410 catch lives inside the loop so that a 410 short-circuits but other
 * thrown errors propagate (matching the prior inline implementations).
 */
export const pollUntilTerminal = async (
  jwt: string,
  paymentIntentId: string,
  options?: { timeoutMs?: number; intervalMs?: number; userAgent?: string }
): Promise<PollOutcome> => {
  const timeoutMs = options?.timeoutMs ?? CHECKOUT_POLL_TIMEOUT_MS;
  const intervalMs = options?.intervalMs ?? CHECKOUT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let status: CheckoutStatusResponse;
    try {
      status = await getPaymentStatus(jwt, paymentIntentId, options?.userAgent);
    } catch (error) {
      if (getHttpStatus(error) === 410) return { kind: "expired" };
      throw error;
    }
    if (status.readyToRedirect) return { kind: "completed", status };
    if (status.phase === "expired") return { kind: "expired", status };
    if (status.phase === "failed") return { kind: "failed", status };
    await sleep(intervalMs);
  }
  return { kind: "timeout" };
};
