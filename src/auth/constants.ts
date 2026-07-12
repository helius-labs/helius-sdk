import type { Address } from "@solana/kit";

/**
 * Helius API root. MUST include the `/v0` path prefix — SDK endpoints are appended
 * as literal paths (e.g. `${API_URL}/oauth/token`).
 *
 * Kept as a plain string literal so the bundler can tree-shake. The env override
 * (`HELIUS_API_URL`) is honored at call time inside `authRequest`, mirroring the
 * call-time pattern documented on `PAYMENT_HOST` below.
 */
export const API_URL = "https://dev-api.helius.xyz/v0";

/**
 * Host that serves the public hosted-checkout page used by `signup` /
 * `signupAndPay`. The full URL is `${PAYMENT_HOST}/pay/<paymentIntentId>`.
 *
 * Override resolution order at call time:
 *   1. explicit `paymentHost` arg passed to signup/signupAndPay
 *   2. `process.env.HELIUS_PAYMENT_HOST` (browser/Deno-safe)
 *   3. this constant
 */
export const PAYMENT_HOST = "https://dashboard.helius.dev";

export const TREASURY =
  "CEs84tEowsXpH8u4VBf8rJSVgSRypFMfXw9CpGRtQgb6" as Address;

export const USDC_MINT_MAINNET =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;

export const USDC_MINT_DEVNET =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as Address;

export const USDC_MINT = USDC_MINT_MAINNET;

/** Legacy: 1 USDC (6 decimals). Only used by payUSDC. */
export const PAYMENT_AMOUNT = 1_000_000n;

/**
 * Maps plan catalog keys to backend price lookup keys.
 *
 * For developer/business/professional, the value is the key under
 * `stripe.priceIds.Monthly` / `Yearly` returned by `/dev-portal/configs`.
 *
 * For agent, the value is the backend `UsagePlan` enum (`agent_v4`) but
 * the priceId itself lives at the flat path `stripe.priceIds.AgentPlan`
 * and is only returned when the request includes `?agent=cli`.
 * `resolvePriceId` branches on plan name to handle this.
 */
export const PLAN_TO_USAGE_PLAN: Record<string, string> = {
  developer: "developer_v4",
  business: "business_v4",
  professional: "professional_v4",
  agent: "agent_v4",
};

/** Minimum SOL needed for transaction fees (~0.001 SOL) */
export const MIN_SOL_FOR_TX = 1_000_000n;

export const MEMO_PROGRAM_ID =
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" as Address;

export const CHECKOUT_POLL_INTERVAL_MS = 1_000;
export const CHECKOUT_POLL_TIMEOUT_MS = 60_000;
export const PROJECT_POLL_INTERVAL_MS = 2_000;
export const PROJECT_POLL_TIMEOUT_MS = 30_000;

const RPC_URL = "https://api.mainnet-beta.solana.com";
const WS_URL = "wss://api.mainnet-beta.solana.com";

export { RPC_URL, WS_URL };
