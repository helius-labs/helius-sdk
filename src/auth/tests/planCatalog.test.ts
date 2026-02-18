import { PLAN_CATALOG, PLAN_TO_USAGE_PLAN } from "../constants";

describe("PLAN_CATALOG", () => {
  it("has developer, business, and professional plans", () => {
    expect(PLAN_CATALOG.developer).toBeDefined();
    expect(PLAN_CATALOG.business).toBeDefined();
    expect(PLAN_CATALOG.professional).toBeDefined();
  });

  it("each plan has required fields", () => {
    for (const [key, plan] of Object.entries(PLAN_CATALOG)) {
      expect(plan.name).toBeTruthy();
      expect(plan.monthlyPrice).toBeGreaterThan(0);
      expect(plan.yearlyPrice).toBeGreaterThan(0);
      expect(plan.credits).toBeGreaterThan(0);
      expect(plan.requestsPerSecond).toBeGreaterThan(0);
    }
  });
});

describe("PLAN_TO_USAGE_PLAN", () => {
  it("maps all catalog plans to usage plan names", () => {
    expect(PLAN_TO_USAGE_PLAN.developer).toBe("DEVELOPER_V4");
    expect(PLAN_TO_USAGE_PLAN.business).toBe("BUSINESS_V4");
    expect(PLAN_TO_USAGE_PLAN.professional).toBe("PROFESSIONAL_V4");
  });

  it("has entries for all plans in PLAN_CATALOG", () => {
    for (const key of Object.keys(PLAN_CATALOG)) {
      expect(PLAN_TO_USAGE_PLAN[key]).toBeDefined();
    }
  });
});
