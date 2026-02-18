import {
  initializeCheckout,
  pollCheckoutCompletion,
  executeCheckout,
  payPaymentIntent,
  getCheckoutPreview,
  getPaymentIntent,
  getPaymentStatus,
  resolvePriceId,
} from "../checkout";
import { authRequest } from "../utils";
import { checkSolBalance, checkUsdcBalance } from "../checkBalances";
import { payWithMemo } from "../payWithMemo";
import { listProjects } from "../listProjects";
import { getProject } from "../getProject";
import { loadKeypair } from "../loadKeypair";
import { getAddress } from "../getAddress";
import { fetchOpenPayPriceIds } from "../devPortalConfigs";

jest.mock("../utils");
jest.mock("../checkBalances");
jest.mock("../payWithMemo");
jest.mock("../listProjects");
jest.mock("../getProject");
jest.mock("../loadKeypair");
jest.mock("../getAddress");
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
const mockCheckSolBalance = checkSolBalance as jest.MockedFunction<typeof checkSolBalance>;
const mockCheckUsdcBalance = checkUsdcBalance as jest.MockedFunction<typeof checkUsdcBalance>;
const mockPayWithMemo = payWithMemo as jest.MockedFunction<typeof payWithMemo>;
const mockListProjects = listProjects as jest.MockedFunction<typeof listProjects>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockLoadKeypair = loadKeypair as jest.MockedFunction<typeof loadKeypair>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockFetchOpenPayPriceIds = fetchOpenPayPriceIds as jest.MockedFunction<typeof fetchOpenPayPriceIds>;

const MOCK_PRICE_IDS = {
  Monthly: { DEVELOPER_V4: "price_dev_monthly", BUSINESS_V4: "price_biz_monthly", PROFESSIONAL_V4: "price_pro_monthly" },
  Yearly: { DEVELOPER_V4: "price_dev_yearly", BUSINESS_V4: "price_biz_yearly", PROFESSIONAL_V4: "price_pro_yearly" },
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
    mockFetchOpenPayPriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "developer", "monthly");
    expect(result).toBe("price_dev_monthly");
  });

  it("resolves business yearly", async () => {
    mockFetchOpenPayPriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "business", "yearly");
    expect(result).toBe("price_biz_yearly");
  });

  it("is case-insensitive for plan name", async () => {
    mockFetchOpenPayPriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    const result = await resolvePriceId("jwt", "Developer", "monthly");
    expect(result).toBe("price_dev_monthly");
  });

  it("throws for unknown plan", async () => {
    await expect(resolvePriceId("jwt", "enterprise", "monthly")).rejects.toThrow(
      "Unknown plan: enterprise"
    );
  });

  it("includes available plans in error", async () => {
    await expect(resolvePriceId("jwt", "invalid", "monthly")).rejects.toThrow(
      "Available: developer, business, professional"
    );
  });

  it("throws when priceId not found in configs", async () => {
    mockFetchOpenPayPriceIds.mockResolvedValue({
      Monthly: {},
      Yearly: {},
    });
    await expect(resolvePriceId("jwt", "developer", "monthly")).rejects.toThrow(
      "No priceId found for developer (monthly)"
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
        status: "pending", phase: "confirming",
        subscriptionActive: false, readyToRedirect: false, message: "Confirming..."
      })
      .mockResolvedValueOnce({
        status: "pending", phase: "activating",
        subscriptionActive: false, readyToRedirect: false, message: "Activating..."
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
      status: "pending", phase: "confirming",
      subscriptionActive: false, readyToRedirect: false, message: "Still waiting"
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

describe("executeCheckout", () => {
  const mockSecretKey = new Uint8Array(64).fill(1);

  function setupDefaultMocks() {
    mockFetchOpenPayPriceIds.mockResolvedValue(MOCK_PRICE_IDS);
    mockLoadKeypair.mockReturnValue({
      publicKey: new Uint8Array(32),
      secretKey: mockSecretKey,
    });
    mockGetAddress.mockResolvedValue("WalletAddress111111111111111111");
    mockCheckSolBalance.mockResolvedValue(10_000_000n);
    mockCheckUsdcBalance.mockResolvedValue(50_000_000n); // 50 USDC
    mockPayWithMemo.mockResolvedValue("tx-sig-abc");
    mockListProjects.mockResolvedValue([
      { id: "proj-1", name: "Test" },
    ] as never);
    mockGetProject.mockResolvedValue({
      apiKeys: [{ keyId: "key-123" }],
    } as never);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaultMocks();

    // Default authRequest: init → poll completed
    mockAuthRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
  });

  it("completes the full checkout flow", async () => {
    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("completed");
    expect(result.txSignature).toBe("tx-sig-abc");
    expect(result.projectId).toBe("proj-1");
    expect(result.apiKey).toBe("key-123");
    expect(result.paymentIntentId).toBe("pi_test");

    // Verify memo is intent.id and amount uses * 10_000n
    expect(mockPayWithMemo).toHaveBeenCalledWith(
      mockSecretKey,
      "Treasury111",
      49_000_000n, // 4900 cents * 10_000
      "pi_test"    // intent.id as memo
    );
  });

  it("returns failed on insufficient SOL", async () => {
    mockCheckSolBalance.mockResolvedValue(100n);

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Insufficient SOL");
    expect(result.txSignature).toBeNull();
  });

  it("returns failed on insufficient USDC", async () => {
    mockCheckUsdcBalance.mockResolvedValue(500_000n); // 0.5 USDC

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Insufficient USDC");
    expect(result.txSignature).toBeNull();
  });

  it("returns failed with txSignature null on payment error", async () => {
    mockPayWithMemo.mockRejectedValue(new Error("Transaction failed"));

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("failed");
    expect(result.txSignature).toBeNull();
    expect(result.error).toBe("Transaction failed");
  });

  it("returns timeout when payment polling times out", async () => {
    mockAuthRequest.mockReset();
    mockAuthRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      // All subsequent calls return non-ready status
      .mockResolvedValue({
        status: "pending", phase: "confirming",
        subscriptionActive: false, readyToRedirect: false, message: "Waiting"
      });

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("timeout");
    expect(result.txSignature).toBe("tx-sig-abc");
  });

  it("handles $0 checkout - no USDC transfer", async () => {
    const zeroIntent = { ...INIT_RESPONSE, amount: 0 };
    mockAuthRequest.mockReset();
    mockAuthRequest
      .mockResolvedValueOnce(zeroIntent)
      .mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      plan: "developer",
      period: "monthly",
      refId: "ref-1",
    });

    expect(result.status).toBe("completed");
    expect(mockPayWithMemo).not.toHaveBeenCalled();
    expect(mockCheckSolBalance).not.toHaveBeenCalled();
    expect(mockCheckUsdcBalance).not.toHaveBeenCalled();
  });

  it("skips project polling when skipProjectPolling is true", async () => {
    const result = await executeCheckout(
      mockSecretKey,
      "jwt-token",
      { plan: "developer", period: "monthly", refId: "ref-1" },
      undefined,
      { skipProjectPolling: true },
    );

    expect(result.status).toBe("completed");
    expect(result.projectId).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
    expect(mockListProjects).not.toHaveBeenCalled();
  });
});

describe("getCheckoutPreview", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFetchOpenPayPriceIds.mockResolvedValue(MOCK_PRICE_IDS);
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

    const result = await getCheckoutPreview("jwt", "business", "monthly", "proj-1", "SAVE10", "agent");

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
