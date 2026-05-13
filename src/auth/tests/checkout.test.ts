import {
  initializeCheckout,
  pollCheckoutCompletion,
  getCheckoutPreview,
  getPaymentIntent,
  resolvePriceId,
} from "../checkout";
import { getPaymentStatus } from "../getPaymentStatus";
import { authRequest } from "../utils";
import { fetchStripePriceIds } from "../devPortalConfigs";

jest.mock("../utils");
jest.mock("../devPortalConfigs");

// Mock polling constants to make tests fast
jest.mock("../constants", () => ({
  ...jest.requireActual("../constants"),
  CHECKOUT_POLL_INTERVAL_MS: 10,
  CHECKOUT_POLL_TIMEOUT_MS: 100,
  PROJECT_POLL_INTERVAL_MS: 10,
  PROJECT_POLL_TIMEOUT_MS: 100,
}));

const mockAuthRequest = authRequest as jest.MockedFunction<typeof authRequest>;
const mockFetchStripePriceIds = fetchStripePriceIds as jest.MockedFunction<
  typeof fetchStripePriceIds
>;

const MOCK_PRICE_IDS = {
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
};

const MOCK_PRICE_IDS_WITH_AGENT = {
  ...MOCK_PRICE_IDS,
  AgentPlan: "price_agent_plan",
};

const INIT_RESPONSE = {
  id: "pi_test",
  status: "pending",
  destinationWallet: "Treasury111",
  amount: 4900,
  solanaPayUrl: "solana:...",
  expiresAt: "2026-01-01T00:00:00Z",
  createdAt: "2025-12-01T00:00:00Z",
  priceId: "price_dev_monthly",
  refId: "ref-1",
};

const POLL_COMPLETED_RESPONSE = {
  status: "completed",
  phase: "complete",
  subscriptionActive: true,
  readyToRedirect: true,
  message: "Payment successful!",
};

describe("resolvePriceId", () => {
  beforeEach(() => jest.resetAllMocks());

  it("resolves developer monthly", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "developer", "monthly");
    expect(result).toBe("price_dev_monthly");
  });

  it("resolves business yearly", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "business", "yearly");
    expect(result).toBe("price_biz_yearly");
  });

  it("is case-insensitive for plan name", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "Developer", "monthly");
    expect(result).toBe("price_dev_monthly");
  });

  it("resolves agent plan and auto-sends ?agent=cli", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS_WITH_AGENT);
    const result = await resolvePriceId("jwt", "agent", "monthly");
    expect(result).toBe("price_agent_plan");
    expect(mockFetchStripePriceIds).toHaveBeenCalledWith(
      "jwt",
      { includeAgentPlan: true },
      undefined
    );
  });

  it("ignores period for agent plan", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS_WITH_AGENT);
    const monthly = await resolvePriceId("jwt", "agent", "monthly");
    const yearly = await resolvePriceId("jwt", "agent", "yearly");
    expect(monthly).toBe("price_agent_plan");
    expect(yearly).toBe("price_agent_plan");
  });

  it("throws when AgentPlan is missing from response", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    await expect(resolvePriceId("jwt", "agent", "monthly")).rejects.toThrow(
      /stripe\.priceIds\.AgentPlan|PRICE_ID_AGENT_PLAN/
    );
  });

  it("does NOT send ?agent=cli for non-agent plans (dashboard regression guard)", async () => {
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    await resolvePriceId("jwt", "developer", "monthly");
    expect(mockFetchStripePriceIds).toHaveBeenCalledWith(
      "jwt",
      undefined,
      undefined
    );
  });

  it("throws for unknown plan", async () => {
    await expect(
      resolvePriceId("jwt", "enterprise", "monthly")
    ).rejects.toThrow("Unknown plan: enterprise");
  });

  it("rejects basic with Unknown plan error (removed from supported set)", async () => {
    await expect(resolvePriceId("jwt", "basic", "monthly")).rejects.toThrow(
      "Unknown plan: basic"
    );
  });

  it("includes available plans in error (basic absent, agent present)", async () => {
    await expect(resolvePriceId("jwt", "invalid", "monthly")).rejects.toThrow(
      "Available: developer, business, professional, agent"
    );
  });

  it("throws when priceId not found in configs (empty)", async () => {
    mockFetchStripePriceIds.mockResolvedValue({
      Monthly: {},
      Yearly: {},
    });
    await expect(resolvePriceId("jwt", "developer", "monthly")).rejects.toThrow(
      "pricing configuration is empty"
    );
  });

  it("throws with available keys when key mismatch", async () => {
    mockFetchStripePriceIds.mockResolvedValue({
      Monthly: { some_other_plan: "price_unknown" },
      Yearly: {},
    });
    await expect(resolvePriceId("jwt", "developer", "monthly")).rejects.toThrow(
      'Expected key "developer_v4" but available keys are: [some_other_plan]'
    );
  });
});

describe("initializeCheckout", () => {
  beforeEach(() => jest.resetAllMocks());

  it("sends POST to /checkout/initialize with JWT and request body", async () => {
    mockAuthRequest.mockResolvedValue(INIT_RESPONSE);

    const result = await initializeCheckout(
      "jwt-token",
      { priceId: "price_dev_monthly", refId: "ref-1" },
      "test-agent"
    );

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/initialize",
      {
        method: "POST",
        headers: { Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ priceId: "price_dev_monthly", refId: "ref-1" }),
      },
      "test-agent"
    );
    expect(result).toEqual(INIT_RESPONSE);
  });
});

describe("pollCheckoutCompletion", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns immediately when readyToRedirect is true", async () => {
    mockAuthRequest.mockResolvedValue(POLL_COMPLETED_RESPONSE);

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.readyToRedirect).toBe(true);
    expect(result.phase).toBe("complete");
    expect(mockAuthRequest).toHaveBeenCalledTimes(1);
  });

  it("returns immediately on failed phase", async () => {
    mockAuthRequest.mockResolvedValue({
      status: "failed",
      phase: "failed",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "Payment failed",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.phase).toBe("failed");
  });

  it("returns immediately on expired phase", async () => {
    mockAuthRequest.mockResolvedValue({
      status: "expired",
      phase: "expired",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "Expired",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.phase).toBe("expired");
  });

  it("polls until readyToRedirect", async () => {
    mockAuthRequest
      .mockResolvedValueOnce({
        status: "pending",
        phase: "confirming",
        subscriptionActive: false,
        readyToRedirect: false,
        message: "Confirming...",
      })
      .mockResolvedValueOnce({
        status: "pending",
        phase: "activating",
        subscriptionActive: false,
        readyToRedirect: false,
        message: "Activating...",
      })
      .mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);

    const result = await pollCheckoutCompletion("jwt", "pi_123", undefined, {
      intervalMs: 10,
      timeoutMs: 5000,
    });

    expect(result.readyToRedirect).toBe(true);
    expect(mockAuthRequest).toHaveBeenCalledTimes(3);
  });

  it("returns timeout status on timeout", async () => {
    mockAuthRequest.mockResolvedValue({
      status: "pending",
      phase: "confirming",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "Still waiting",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123", undefined, {
      intervalMs: 10,
      timeoutMs: 50,
    });

    expect(result.status).toBe("pending");
    expect(result.phase).toBe("confirming");
    expect(result.message).toBe("Polling timed out");
  });

  it("handles HTTP 410 as expired without throwing", async () => {
    mockAuthRequest.mockRejectedValue(new Error("API error (410): Gone"));

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.phase).toBe("expired");
    expect(result.status).toBe("expired");
    expect(result.readyToRedirect).toBe(false);
  });
});

describe("getCheckoutPreview", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFetchStripePriceIds.mockResolvedValue(MOCK_PRICE_IDS);
  });

  it("resolves priceId and sends GET to /checkout/preview with query params", async () => {
    const mockPreview = {
      planName: "Business",
      period: "monthly",
      baseAmount: 49900,
      subtotal: 49900,
      appliedCredits: 0,
      proratedCredits: 2345,
      discounts: 0,
      dueToday: 47555,
      destinationWallet: "Treasury111",
      note: "",
    };
    mockAuthRequest.mockResolvedValue(mockPreview);

    const result = await getCheckoutPreview(
      "jwt",
      "business",
      "monthly",
      "proj-1",
      "SAVE10",
      "agent"
    );

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/preview?priceId=price_biz_monthly&refId=proj-1&couponCode=SAVE10",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      "agent"
    );
    expect(result.dueToday).toBe(47555);
  });

  it("sends GET without couponCode when not provided", async () => {
    mockAuthRequest.mockResolvedValue({});

    await getCheckoutPreview("jwt", "developer", "monthly", "proj-1");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/preview?priceId=price_dev_monthly&refId=proj-1",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      undefined
    );
  });
});

describe("getPaymentIntent", () => {
  beforeEach(() => jest.resetAllMocks());

  it("fetches payment intent by ID", async () => {
    mockAuthRequest.mockResolvedValue(INIT_RESPONSE);

    const result = await getPaymentIntent("jwt", "pi_test", "agent");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/pi_test",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      "agent"
    );
    expect(result.id).toBe("pi_test");
  });
});

describe("getPaymentStatus", () => {
  beforeEach(() => jest.resetAllMocks());

  it("fetches payment status", async () => {
    mockAuthRequest.mockResolvedValue(POLL_COMPLETED_RESPONSE);

    const result = await getPaymentStatus("jwt", "pi_test", "agent");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/pi_test/status",
      { method: "GET", headers: { Authorization: "Bearer jwt" } },
      "agent"
    );
    expect(result.readyToRedirect).toBe(true);
  });
});
