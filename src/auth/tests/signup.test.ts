jest.mock("../loadKeypair", () => ({
  loadKeypair: jest.fn(() => ({
    publicKey: new Uint8Array(32),
    secretKey: new Uint8Array(64),
  })),
}));

jest.mock("../getAddress", () => ({
  getAddress: jest.fn().mockResolvedValue("Wallet111"),
}));

jest.mock("../signAuthMessage", () => ({
  signAuthMessage: jest
    .fn()
    .mockResolvedValue({ message: "msg", signature: "sig" }),
}));

jest.mock("../walletSignup", () => ({
  walletSignup: jest
    .fn()
    .mockResolvedValue({ token: "jwt-1", refId: "ref-1", newUser: true }),
}));

jest.mock("../listProjects", () => ({
  listProjects: jest.fn(),
}));

jest.mock("../getProject", () => ({
  getProject: jest.fn(),
}));

jest.mock("../createApiKey", () => ({
  createApiKey: jest.fn(),
}));

jest.mock("../checkout", () => ({
  resolvePriceId: jest.fn().mockResolvedValue("price_agent_1_usdc"),
  getCheckoutPreview: jest.fn(),
  initializeCheckout: jest.fn(),
  getPaymentStatus: jest.fn(),
}));

jest.mock("../payPaymentLink", () => ({
  payPaymentLink: jest.fn().mockResolvedValue({ txSignature: "tx-abc" }),
}));

import { signup } from "../signup";
import { signupAndPay } from "../signupAndPay";
import { listProjects } from "../listProjects";
import { getProject } from "../getProject";
import { createApiKey } from "../createApiKey";
import {
  getCheckoutPreview,
  initializeCheckout,
  getPaymentStatus,
} from "../checkout";
import { payPaymentLink } from "../payPaymentLink";

const mockListProjects = listProjects as jest.MockedFunction<
  typeof listProjects
>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockCreateApiKey = createApiKey as jest.MockedFunction<
  typeof createApiKey
>;
const mockGetCheckoutPreview = getCheckoutPreview as jest.MockedFunction<
  typeof getCheckoutPreview
>;
const mockInitializeCheckout = initializeCheckout as jest.MockedFunction<
  typeof initializeCheckout
>;
const mockGetPaymentStatus = getPaymentStatus as jest.MockedFunction<
  typeof getPaymentStatus
>;
const mockPayPaymentLink = payPaymentLink as jest.MockedFunction<
  typeof payPaymentLink
>;

const baseOpts = {
  secretKey: new Uint8Array(64),
  plan: "agent" as const,
  email: "a@b.com",
  firstName: "A",
  lastName: "B",
};

const intent = {
  id: "pi_abc",
  status: "pending" as const,
  amount: 1000,
  destinationWallet: "Treasury111",
  solanaPayUrl: "solana:Treasury111?amount=10",
  expiresAt: "2026-12-31T00:00:00Z",
  createdAt: "2026-05-01T00:00:00Z",
  priceId: "price_agent_1_usdc",
  refId: "ref-1",
};

const preview = {
  planName: "Agent Plan",
  period: "monthly" as const,
  baseAmount: 1000,
  subtotal: 1000,
  appliedCredits: 0,
  proratedCredits: 0,
  discounts: 0,
  dueToday: 1000,
  destinationWallet: "Treasury111",
  note: "",
};

const subscription = (plan: string) => ({
  id: "sub-1",
  plan,
  billingPeriodStart: "2026-05-01T00:00:00Z",
  billingPeriodEnd: "2026-06-01T00:00:00Z",
  cryptoSub: true,
  paymentServiceProvider: "stripe",
});

describe("signup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unknown plan", async () => {
    await expect(
      signup({ ...baseOpts, plan: "enterprise" as never })
    ).rejects.toThrow(/Unknown plan/);
  });

  it("requires contact info when creating a fresh intent (no existing project)", async () => {
    mockListProjects.mockResolvedValue([]);
    await expect(
      signup({
        secretKey: new Uint8Array(64),
        plan: "agent",
      } as never)
    ).rejects.toThrow(/contact info/);
  });

  it("does NOT require contact info when wallet already has a matching project", async () => {
    // already_subscribed short-circuit must not demand email/firstName/lastName.
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("agent_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);
    mockGetProject.mockResolvedValue({
      apiKeys: [{ keyId: "key-1" } as never],
      creditsUsage: {} as never,
      billingCycle: { start: "", end: "" },
      subscriptionPlanDetails: {} as never,
      prepaidCreditsLink: "",
    });

    const result = await signup({
      secretKey: new Uint8Array(64),
      plan: "agent",
    } as never);
    expect(result.kind).toBe("already_subscribed");
  });

  it("does NOT require contact info when wallet has a different-plan project (upgrade_required)", async () => {
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("developer_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);

    const result = await signup({
      secretKey: new Uint8Array(64),
      plan: "agent",
    } as never);
    expect(result.kind).toBe("upgrade_required");
  });

  it("returns payment_required for new wallet, never sends sponsored mode", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await signup(baseOpts);

    expect(result.kind).toBe("payment_required");
    if (result.kind !== "payment_required") throw new Error();
    expect(result.paymentLink.paymentIntentId).toBe("pi_abc");
    expect(result.paymentLink.paymentUrl).toContain("/pay/pi_abc");
    expect(result.paymentLink.memo).toBe("pi_abc");
    expect(result.paymentLink.amountCents).toBe(1000);
    expect(result.paymentLink.planName).toBe("Agent Plan");

    expect(mockInitializeCheckout).toHaveBeenCalledTimes(1);
    const sentBody = mockInitializeCheckout.mock.calls[0][1];
    expect(sentBody.paymentMode).toBe("self_funded");
    expect(sentBody).not.toHaveProperty("signupWalletAddress");
  });

  it("rejects zero-amount checkouts when preview is reachable (e.g. existing customer)", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue({ ...preview, dueToday: 0 });

    await expect(signup(baseOpts)).rejects.toThrow(/Zero-amount/);
    expect(mockInitializeCheckout).not.toHaveBeenCalled();
  });

  it("falls through to /checkout/initialize when preview itself errors (fresh-signup case)", async () => {
    // Backend throws "Customer ID is required for one time preview" when no
    // Stripe customer exists yet (the dominant fresh-signup case). The SDK
    // must swallow that error and let initialize create the customer + intent.
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockRejectedValue(
      new Error("API error (400): Customer ID is required for one time preview")
    );
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await signup(baseOpts);
    expect(result.kind).toBe("payment_required");
    expect(mockInitializeCheckout).toHaveBeenCalledTimes(1);
  });

  it("returns already_subscribed and creates an API key when none exists", async () => {
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("agent_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);
    mockGetProject.mockResolvedValue({
      apiKeys: [],
      creditsUsage: {} as never,
      billingCycle: { start: "", end: "" },
      subscriptionPlanDetails: {
        currentPlan: "agent_v4",
        upcomingPlan: "agent_v4",
        isUpgrading: false,
      },
      prepaidCreditsLink: "",
    });
    mockCreateApiKey.mockResolvedValue({
      keyId: "key-new",
      keyName: "",
      walletId: "",
      projectId: "proj-1",
      usagePlan: "agent_v4",
      createdAt: 0,
      prepaidCredits: 0,
    });

    const result = await signup(baseOpts);
    expect(result.kind).toBe("already_subscribed");
    if (result.kind !== "already_subscribed") throw new Error();
    expect(result.apiKey).toBe("key-new");
    expect(mockCreateApiKey).toHaveBeenCalledWith(
      "jwt-1",
      "proj-1",
      "Wallet111"
    );
  });

  it("returns upgrade_required when existing project is on a different plan", async () => {
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("developer_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);

    const result = await signup(baseOpts);
    expect(result.kind).toBe("upgrade_required");
    if (result.kind !== "upgrade_required") throw new Error();
    expect(result.currentPlan).toBe("developer_v4");
    expect(result.requestedPlan).toBe("agent");
    expect(mockInitializeCheckout).not.toHaveBeenCalled();
  });

  it("returns upgrade_required when existing subscription period differs", async () => {
    // monthly subscription period (~30 days), user requests yearly
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("developer_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);

    const result = await signup({
      ...baseOpts,
      plan: "developer",
      period: "yearly",
    });
    expect(result.kind).toBe("upgrade_required");
  });

  it("paymentHost override flows into the returned URL", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await signup({
      ...baseOpts,
      paymentHost: "https://staging.example.com",
    });
    if (result.kind !== "payment_required") throw new Error();
    expect(result.paymentLink.paymentUrl).toBe(
      "https://staging.example.com/pay/pi_abc"
    );
  });

  it("preauthenticated path skips walletSignup", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);

    const { signAuthMessage } = await import("../signAuthMessage");
    (signAuthMessage as jest.Mock).mockClear();

    const result = await signup({
      jwt: "preauth-jwt",
      refId: "preauth-ref",
      walletAddress: "Wallet999",
      plan: "agent",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
    });

    expect(result.kind).toBe("payment_required");
    expect(signAuthMessage).not.toHaveBeenCalled();
    if (result.kind !== "payment_required") throw new Error();
    expect(result.jwt).toBe("preauth-jwt");
    expect(result.walletAddress).toBe("Wallet999");
  });
});

describe("signupAndPay", () => {
  beforeEach(() => jest.clearAllMocks());

  it("short-circuits on already_subscribed without paying", async () => {
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("agent_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);
    mockGetProject.mockResolvedValue({
      apiKeys: [{ keyId: "key-1" } as never],
      creditsUsage: {} as never,
      billingCycle: { start: "", end: "" },
      subscriptionPlanDetails: {} as never,
      prepaidCreditsLink: "",
    });

    const result = await signupAndPay(baseOpts);
    expect(result.kind).toBe("already_subscribed");
    expect(mockPayPaymentLink).not.toHaveBeenCalled();
  });

  it("short-circuits on upgrade_required without paying", async () => {
    mockListProjects.mockResolvedValue([
      {
        id: "proj-1",
        name: "p",
        createdAt: "",
        verifiedEmail: null,
        subscription: subscription("business_v4"),
        users: [],
        dnsRecords: [],
      },
    ]);

    const result = await signupAndPay(baseOpts);
    expect(result.kind).toBe("upgrade_required");
    expect(mockPayPaymentLink).not.toHaveBeenCalled();
  });

  it("returns completed after successful pay + activate", async () => {
    mockListProjects
      .mockResolvedValueOnce([]) // signup: no existing project
      .mockResolvedValueOnce([
        {
          id: "proj-new",
          name: "p",
          createdAt: "",
          verifiedEmail: null,
          subscription: subscription("agent_v4"),
          users: [],
          dnsRecords: [],
        },
      ]); // provisionApiKey
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "completed",
      phase: "complete",
      subscriptionActive: true,
      readyToRedirect: true,
      message: "ok",
    });
    mockGetProject.mockResolvedValue({
      apiKeys: [{ keyId: "key-new" } as never],
      creditsUsage: {} as never,
      billingCycle: { start: "", end: "" },
      subscriptionPlanDetails: {} as never,
      prepaidCreditsLink: "",
    });

    const result = await signupAndPay(baseOpts);
    expect(result.kind).toBe("completed");
    if (result.kind !== "completed") throw new Error();
    expect(result.txSignature).toBe("tx-abc");
    expect(result.apiKey).toBe("key-new");
    expect(mockPayPaymentLink).toHaveBeenCalledTimes(1);
  });

  it("returns expired when status reports expired phase", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "expired",
      phase: "expired",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "expired",
    });

    const result = await signupAndPay(baseOpts);
    expect(result.kind).toBe("expired");
  });

  it("returns failed when status reports failed phase", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "failed",
      phase: "failed",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "boom",
    });

    const result = await signupAndPay(baseOpts);
    expect(result.kind).toBe("failed");
    if (result.kind !== "failed") throw new Error();
    expect(result.reason).toBe("boom");
  });

  it("returns pending with paymentLink + txSignature on poll timeout", async () => {
    mockListProjects.mockResolvedValue([]);
    mockGetCheckoutPreview.mockResolvedValue(preview);
    mockInitializeCheckout.mockResolvedValue(intent);
    // Always pending — poll will time out
    mockGetPaymentStatus.mockResolvedValue({
      status: "pending",
      phase: "confirming",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "still going",
    });

    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    const promise = signupAndPay(baseOpts);
    // Fast-forward past the poll timeout
    await jest.advanceTimersByTimeAsync(120_000);
    const result = await promise;
    jest.useRealTimers();

    expect(result.kind).toBe("pending");
    if (result.kind !== "pending") throw new Error();
    expect(result.txSignature).toBe("tx-abc");
    expect(result.paymentLink.paymentIntentId).toBe("pi_abc");
  });
});
