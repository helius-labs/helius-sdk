export interface PlanInfo {
  name: string;
  monthlyPrice: number; // cents
  yearlyPrice: number; // cents
  credits: number; // included credits
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
