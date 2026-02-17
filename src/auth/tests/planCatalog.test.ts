import { PLAN_CATALOG, resolvePriceId, DEFAULT_DEVELOPER_MONTHLY_PRICE_ID } from "../constants";

describe("PLAN_CATALOG", () => {
  it("has developer, business, and professional plans", () => {
    expect(PLAN_CATALOG.developer).toBeDefined();
    expect(PLAN_CATALOG.business).toBeDefined();
    expect(PLAN_CATALOG.professional).toBeDefined();
  });

  it("each plan has required fields", () => {
    for (const [key, plan] of Object.entries(PLAN_CATALOG)) {
      expect(plan.name).toBeTruthy();
      expect(plan.priceIds.monthly).toBeTruthy();
      expect(plan.priceIds.yearly).toBeTruthy();
      expect(plan.monthlyPrice).toBeGreaterThan(0);
      expect(plan.yearlyPrice).toBeGreaterThan(0);
      expect(plan.credits).toBeGreaterThan(0);
      expect(plan.requestsPerSecond).toBeGreaterThan(0);
    }
  });
});

describe("resolvePriceId", () => {
  it("resolves developer monthly", () => {
    expect(resolvePriceId("developer", "monthly")).toBe(PLAN_CATALOG.developer.priceIds.monthly);
  });

  it("resolves business yearly", () => {
    expect(resolvePriceId("business", "yearly")).toBe(PLAN_CATALOG.business.priceIds.yearly);
  });

  it("resolves professional monthly", () => {
    expect(resolvePriceId("professional")).toBe(PLAN_CATALOG.professional.priceIds.monthly);
  });

  it("is case-insensitive", () => {
    expect(resolvePriceId("Developer")).toBe(PLAN_CATALOG.developer.priceIds.monthly);
    expect(resolvePriceId("BUSINESS", "yearly")).toBe(PLAN_CATALOG.business.priceIds.yearly);
  });

  it("defaults to monthly", () => {
    expect(resolvePriceId("developer")).toBe(PLAN_CATALOG.developer.priceIds.monthly);
  });

  it("throws for unknown plan", () => {
    expect(() => resolvePriceId("enterprise")).toThrow("Unknown plan: enterprise");
  });

  it("includes available plans in error", () => {
    expect(() => resolvePriceId("invalid")).toThrow("Available: developer, business, professional");
  });
});

describe("DEFAULT_DEVELOPER_MONTHLY_PRICE_ID", () => {
  it("matches developer monthly price", () => {
    expect(DEFAULT_DEVELOPER_MONTHLY_PRICE_ID).toBe(PLAN_CATALOG.developer.priceIds.monthly);
  });
});
