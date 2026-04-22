import {
  fetchDevPortalConfigs,
  fetchStripePriceIds,
  fetchPrepaidCreditsPriceIds,
  fetchOpenPayPriceIds,
} from "../devPortalConfigs";
import { authRequest } from "../utils";

jest.mock("../utils");

const mockAuthRequest = authRequest as jest.MockedFunction<typeof authRequest>;

const MOCK_CONFIGS = {
  stripe: {
    priceIds: {
      Monthly: {
        developer_v4: "price_dev_monthly",
        business_v4: "price_biz_monthly",
        professional_v4: "price_pro_monthly",
      },
      Yearly: {
        developer_v4: "price_dev_yearly",
        business_v4: "price_biz_yearly",
        professional_v4: "price_pro_yearly",
      },
    },
    prepaidCreditsPlans: {
      prepaid_credits_4_USDC: "price_prepaid_4",
      prepaid_credits_5_USDC: "price_prepaid_5",
      prepaid_credits_10_USDC: "price_prepaid_10",
    },
  },
};

const MOCK_CONFIGS_WITH_AGENT = {
  stripe: {
    ...MOCK_CONFIGS.stripe,
    priceIds: {
      ...MOCK_CONFIGS.stripe.priceIds,
      AgentPlan: "price_agent_plan",
    },
  },
};

describe("fetchDevPortalConfigs", () => {
  beforeEach(() => jest.resetAllMocks());

  it("fetches /dev-portal/configs without query when includeAgentPlan is omitted", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    const result = await fetchDevPortalConfigs("jwt");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      undefined
    );
    expect(result).toBe(MOCK_CONFIGS);
  });

  it("appends ?agent=cli when includeAgentPlan is true", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS_WITH_AGENT);

    await fetchDevPortalConfigs("jwt", { includeAgentPlan: true });

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs?agent=cli",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      undefined
    );
  });

  it("does NOT append ?agent=cli when includeAgentPlan is false (dashboard regression guard)", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    await fetchDevPortalConfigs("jwt", { includeAgentPlan: false });

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs",
      expect.any(Object),
      undefined
    );
  });

  it("forwards userAgent to authRequest", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    await fetchDevPortalConfigs("jwt", undefined, "helius-cli/1.0");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs",
      expect.any(Object),
      "helius-cli/1.0"
    );
  });
});

describe("fetchStripePriceIds", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns stripe.priceIds without AgentPlan by default", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    const result = await fetchStripePriceIds("jwt");

    expect(result.Monthly.developer_v4).toBe("price_dev_monthly");
    expect(result.Yearly.professional_v4).toBe("price_pro_yearly");
    expect(result.AgentPlan).toBeUndefined();
  });

  it("returns AgentPlan when includeAgentPlan is true", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS_WITH_AGENT);

    const result = await fetchStripePriceIds("jwt", { includeAgentPlan: true });

    expect(result.AgentPlan).toBe("price_agent_plan");
  });
});

describe("fetchPrepaidCreditsPriceIds", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns the flat prepaidCreditsPlans record", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    const result = await fetchPrepaidCreditsPriceIds("jwt");

    expect(result.prepaid_credits_10_USDC).toBe("price_prepaid_10");
    expect(result.prepaid_credits_4_USDC).toBe("price_prepaid_4");
  });

  it("returns an empty object when backend omits prepaidCreditsPlans", async () => {
    mockAuthRequest.mockResolvedValue({
      stripe: { priceIds: MOCK_CONFIGS.stripe.priceIds },
    });

    const result = await fetchPrepaidCreditsPriceIds("jwt");

    expect(result).toEqual({});
  });

  it("does NOT send ?agent=cli", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    await fetchPrepaidCreditsPriceIds("jwt");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs",
      expect.any(Object),
      undefined
    );
  });
});

describe("fetchOpenPayPriceIds (deprecated wrapper)", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns {Monthly, Yearly} sourced from stripe.priceIds", async () => {
    mockAuthRequest.mockResolvedValue(MOCK_CONFIGS);

    const result = await fetchOpenPayPriceIds("jwt");

    expect(result).toEqual({
      Monthly: MOCK_CONFIGS.stripe.priceIds.Monthly,
      Yearly: MOCK_CONFIGS.stripe.priceIds.Yearly,
    });
    // Wrapper does not send ?agent=cli
    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/dev-portal/configs",
      expect.any(Object),
      undefined
    );
  });
});
