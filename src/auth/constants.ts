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

// ── Plan Catalog ──

export interface PlanPriceIds {
  monthly: string;
  yearly: string;
}

export interface PlanInfo {
  name: string;
  priceIds: PlanPriceIds;
  monthlyPrice: number;   // cents
  yearlyPrice: number;    // cents
  credits: number;        // included credits
  requestsPerSecond: number;
}

export const PLAN_CATALOG: Record<string, PlanInfo> = {
  developer: {
    name: "Developer",
    priceIds: { monthly: "price_stg_EZrAwZiew077g1qd", yearly: "price_stg_GJmCfkIZkMmvEvNv" },
    monthlyPrice: 4900,
    yearlyPrice: 49000,
    credits: 10_000_000,
    requestsPerSecond: 50,
  },
  business: {
    name: "Business",
    priceIds: { monthly: "price_stg_6ojErfmSSrMAhb8m", yearly: "price_stg_8589Q9esTTtIZI90" },
    monthlyPrice: 49900,
    yearlyPrice: 499000,
    credits: 100_000_000,
    requestsPerSecond: 200,
  },
  professional: {
    name: "Professional",
    priceIds: { monthly: "price_stg_NUYXi0Rriz5mAXet", yearly: "price_stg_byyw3o1vCleDzJn5" },
    monthlyPrice: 99900,
    yearlyPrice: 999000,
    credits: 200_000_000,
    requestsPerSecond: 500,
  },
};

/** Default for agentic signup — staging value, swap for prod later */
export const DEFAULT_DEVELOPER_MONTHLY_PRICE_ID = PLAN_CATALOG.developer.priceIds.monthly;

/** Resolve plan name + period to priceId */
export function resolvePriceId(planName: string, period: "monthly" | "yearly" = "monthly"): string {
  const plan = PLAN_CATALOG[planName.toLowerCase()];
  if (!plan) throw new Error(`Unknown plan: ${planName}. Available: ${Object.keys(PLAN_CATALOG).join(", ")}`);
  return plan.priceIds[period];
}

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
