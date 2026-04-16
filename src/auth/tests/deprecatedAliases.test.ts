import {
  fetchOpenPayPriceIds,
  fetchStripePriceIds,
} from "../devPortalConfigs";
import {
  OPENPAY_PLANS,
  PAID_PLANS,
  type OpenPayPlan,
  type PaidPlan,
} from "../constants";
import { isOpenPayPlan, isPaidPlan } from "../signupHelpers";

describe("deprecated auth aliases", () => {
  it("keeps fetchOpenPayPriceIds as an alias of fetchStripePriceIds", () => {
    expect(fetchOpenPayPriceIds).toBe(fetchStripePriceIds);
  });

  it("keeps OPENPAY_PLANS as an alias of PAID_PLANS", () => {
    expect(OPENPAY_PLANS).toBe(PAID_PLANS);
    expect(OPENPAY_PLANS).toEqual(["developer", "business", "professional"]);
  });

  it("keeps isOpenPayPlan as an alias of isPaidPlan", () => {
    expect(isOpenPayPlan).toBe(isPaidPlan);
    expect(isOpenPayPlan("developer")).toBe(true);
    expect(isOpenPayPlan("basic")).toBe(false);
  });

  it("keeps the legacy plan type alias assignable", () => {
    const legacyPlan: OpenPayPlan = "developer";
    const paidPlan: PaidPlan = legacyPlan;

    expect(paidPlan).toBe("developer");
  });
});
