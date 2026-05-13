jest.mock("../listProjects", () => ({ listProjects: jest.fn() }));
jest.mock("../getProject", () => ({ getProject: jest.fn() }));
jest.mock("../checkout", () => ({
  resolvePriceId: jest.fn(),
  initializeCheckout: jest.fn(),
  getCheckoutPreview: jest.fn(),
}));
jest.mock("../getPaymentStatus", () => ({
  getPaymentStatus: jest.fn(),
}));
jest.mock("../payPaymentLink", () => ({
  payPaymentLink: jest
    .fn()
    .mockResolvedValue({ txSignature: "tx-sig-credits" }),
}));

import { purchaseCredits, purchaseCreditsAndPay } from "../purchaseCredits";
import { listProjects } from "../listProjects";
import { getProject } from "../getProject";
import { initializeCheckout } from "../checkout";
import { getPaymentStatus } from "../getPaymentStatus";
import { payPaymentLink } from "../payPaymentLink";

const mockListProjects = listProjects as jest.MockedFunction<
  typeof listProjects
>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockInitializeCheckout = initializeCheckout as jest.MockedFunction<
  typeof initializeCheckout
>;
const mockGetPaymentStatus = getPaymentStatus as jest.MockedFunction<
  typeof getPaymentStatus
>;
const mockPayPaymentLink = payPaymentLink as jest.MockedFunction<
  typeof payPaymentLink
>;

const project = (plan = "agent_v4") => ({
  id: "proj-1",
  name: "p",
  createdAt: "",
  verifiedEmail: null,
  subscription: {
    id: "sub-1",
    plan,
    billingPeriodStart: "",
    billingPeriodEnd: "",
    cryptoSub: true,
    paymentServiceProvider: "stripe",
  },
  users: [],
  dnsRecords: [],
});

const projectDetailsAgent = {
  apiKeys: [] as never[],
  creditsUsage: {} as never,
  billingCycle: { start: "", end: "" },
  subscriptionPlanDetails: {} as never,
  prepaidCreditsLink: "",
  prepaidCreditsPriceId: "price_credits_10_usdc",
};

const intent = {
  id: "pi_credits",
  status: "pending" as const,
  amount: 1000,
  destinationWallet: "Treasury",
  solanaPayUrl: "solana:Treasury?amount=10",
  expiresAt: "2027-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  priceId: "price_credits_10_usdc",
  refId: "proj-1",
};

describe("purchaseCredits — link mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a PaymentLink for an agent-plan project", async () => {
    mockListProjects.mockResolvedValue([project()]);
    mockGetProject.mockResolvedValue(projectDetailsAgent);
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await purchaseCredits({
      jwt: "jwt-1",
      projectId: "proj-1",
      qty: 2,
    });

    expect(result.kind).toBe("payment_required");
    expect(result.paymentLink.paymentIntentId).toBe("pi_credits");
    expect(mockInitializeCheckout).toHaveBeenCalledWith(
      "jwt-1",
      expect.objectContaining({
        priceId: "price_credits_10_usdc",
        refId: "proj-1",
        qty: 2,
      })
    );
  });

  it("rejects qty < 1", async () => {
    await expect(
      purchaseCredits({ jwt: "jwt-1", projectId: "proj-1", qty: 0 })
    ).rejects.toThrow(/positive integer/);
  });

  it("rejects projects not on agent plan", async () => {
    mockListProjects.mockResolvedValue([project("developer_v4")]);
    await expect(
      purchaseCredits({ jwt: "jwt-1", projectId: "proj-1" })
    ).rejects.toThrow(/Agent-plan only/);
  });

  it("errors clearly when prepaidCreditsPriceId is missing", async () => {
    mockListProjects.mockResolvedValue([project()]);
    mockGetProject.mockResolvedValue({
      apiKeys: [],
      creditsUsage: {} as never,
      billingCycle: { start: "", end: "" },
      subscriptionPlanDetails: {} as never,
      prepaidCreditsLink: "",
    });
    await expect(
      purchaseCredits({ jwt: "jwt-1", projectId: "proj-1" })
    ).rejects.toThrow(/prepaid-credits priceId/);
  });
});

describe("purchaseCreditsAndPay", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pays + polls + returns completed", async () => {
    mockListProjects.mockResolvedValue([project()]);
    mockGetProject.mockResolvedValue(projectDetailsAgent);
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "completed",
      phase: "complete",
      subscriptionActive: true,
      readyToRedirect: true,
      message: "ok",
    });

    const result = await purchaseCreditsAndPay({
      secretKey: new Uint8Array(64),
      jwt: "jwt-1",
      projectId: "proj-1",
    });

    expect(result.kind).toBe("completed");
    if (result.kind !== "completed") throw new Error();
    expect(result.txSignature).toBe("tx-sig-credits");
    expect(mockPayPaymentLink).toHaveBeenCalledTimes(1);
  });

  it("returns failed when status reports failed", async () => {
    mockListProjects.mockResolvedValue([project()]);
    mockGetProject.mockResolvedValue(projectDetailsAgent);
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "failed",
      phase: "failed",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "boom",
    });

    const result = await purchaseCreditsAndPay({
      secretKey: new Uint8Array(64),
      jwt: "jwt-1",
      projectId: "proj-1",
    });

    expect(result.kind).toBe("failed");
  });
});
