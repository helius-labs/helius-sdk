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

export interface PlanInfo {
  name: string;
  monthlyPrice: number;   // cents
  yearlyPrice: number;    // cents
  credits: number;        // included credits
  requestsPerSecond: number;
}

export const PLAN_CATALOG: Record<string, PlanInfo> = {
  developer: {
    name: "Developer",
    monthlyPrice: 4900,
    yearlyPrice: 49000,
    credits: 10_000_000,
    requestsPerSecond: 50,
  },
  business: {
    name: "Business",
    monthlyPrice: 49900,
    yearlyPrice: 499000,
    credits: 100_000_000,
    requestsPerSecond: 200,
  },
  professional: {
    name: "Professional",
    monthlyPrice: 99900,
    yearlyPrice: 999000,
    credits: 200_000_000,
    requestsPerSecond: 500,
  },
};

/** Maps plan catalog keys to backend UsagePlan names (from dev-portal/configs) */
export const PLAN_TO_USAGE_PLAN: Record<string, string> = {
  developer: "DEVELOPER_V4",
  business: "BUSINESS_V4",
  professional: "PROFESSIONAL_V4",
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
