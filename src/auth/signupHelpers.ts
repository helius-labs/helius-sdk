import { AGENT_PLANS, OPENPAY_PLANS } from "./constants";

export function isOpenPayPlan(plan: string): boolean {
  return (OPENPAY_PLANS as readonly string[]).includes(plan);
}

export function isAgentPlan(plan: string): boolean {
  return (AGENT_PLANS as readonly string[]).includes(plan);
}

export function buildEndpoints(apiKey: string) {
  return {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };
}
