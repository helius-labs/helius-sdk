import { PAID_PLANS } from "./constants";

export function isPaidPlan(plan: string): boolean {
  return (PAID_PLANS as readonly string[]).includes(plan);
}

/** @deprecated Use isPaidPlan instead */
export const isOpenPayPlan = isPaidPlan;

export function buildEndpoints(apiKey: string) {
  return {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };
}
