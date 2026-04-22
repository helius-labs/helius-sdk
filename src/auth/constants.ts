import type { Address } from "@solana/kit";

export const API_URL = "https://dev-api.helius.xyz/v0";

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

// ── OpenPay Plan Names (single source of truth) ──

export const OPENPAY_PLANS = ["developer", "business", "professional"] as const;
export type OpenPayPlan = (typeof OPENPAY_PLANS)[number];

/**
 * The Agent Plan is a one-time 10 USDC purchase that ships with 1,000,000
 * starting credits. Different billing semantics from the OpenPay-family
 * plans (no Monthly/Yearly period, one-time Stripe invoice, Stripe-only
 * provider), so it lives in its own set.
 */
export const AGENT_PLANS = ["agent"] as const;
export type AgentPlan = (typeof AGENT_PLANS)[number];

export const CHECKOUT_POLL_INTERVAL_MS = 1_000;
export const CHECKOUT_POLL_TIMEOUT_MS = 60_000;
export const PROJECT_POLL_INTERVAL_MS = 2_000;
export const PROJECT_POLL_TIMEOUT_MS = 30_000;

const RPC_URL = "https://api.mainnet-beta.solana.com";
const WS_URL = "wss://api.mainnet-beta.solana.com";

export { RPC_URL, WS_URL };
