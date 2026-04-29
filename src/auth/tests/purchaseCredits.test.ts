import { purchaseCredits } from "../purchaseCredits";
import { listProjects } from "../listProjects";
import { getProject } from "../getProject";
import {
  initializeCheckout,
  payPaymentIntent,
  pollCheckoutCompletion,
} from "../checkout";
import { loadKeypair } from "../loadKeypair";
import { getAddress } from "../getAddress";

jest.mock("../listProjects");
jest.mock("../getProject");
jest.mock("../checkout");
jest.mock("../loadKeypair");
jest.mock("../getAddress");

const mockListProjects = listProjects as jest.MockedFunction<
  typeof listProjects
>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockInitializeCheckout = initializeCheckout as jest.MockedFunction<
  typeof initializeCheckout
>;
const mockPayPaymentIntent = payPaymentIntent as jest.MockedFunction<
  typeof payPaymentIntent
>;
const mockPollCheckoutCompletion =
  pollCheckoutCompletion as jest.MockedFunction<typeof pollCheckoutCompletion>;
const mockLoadKeypair = loadKeypair as jest.MockedFunction<typeof loadKeypair>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;

const AGENT_PROJECT = {
  id: "proj-agent",
  name: "Agent Project",
  createdAt: "2025-01-01",
  verifiedEmail: null,
  subscription: { plan: "agent_v4" },
  users: [],
  dnsRecords: [],
} as never;

const DEVELOPER_PROJECT = {
  id: "proj-dev",
  name: "Dev Project",
  createdAt: "2025-01-01",
  verifiedEmail: null,
  subscription: { plan: "developer_v4" },
  users: [],
  dnsRecords: [],
} as never;

const AGENT_PROJECT_DETAILS = {
  apiKeys: [],
  creditsUsage: {} as never,
  billingCycle: {} as never,
  subscriptionPlanDetails: {} as never,
  prepaidCreditsLink: "",
  prepaidCreditsPriceId: "price_prepaid_10",
} as never;

const INIT_RESPONSE = {
  id: "pi_topup",
  status: "pending",
  destinationWallet: "Treasury111",
  amount: 1000, // 10 USDC in cents
  solanaPayUrl: "solana:...",
  expiresAt: "2026-01-01T00:00:00Z",
  createdAt: "2025-12-01T00:00:00Z",
  priceId: "price_prepaid_10",
  refId: "proj-agent",
} as never;

const POLL_COMPLETED = {
  status: "completed",
  phase: "complete",
  subscriptionActive: true,
  readyToRedirect: true,
  message: "ok",
} as never;

describe("purchaseCredits", () => {
  const secretKey = new Uint8Array(64);

  beforeEach(() => {
    jest.resetAllMocks();
    mockLoadKeypair.mockReturnValue({
      publicKey: new Uint8Array(32),
      secretKey,
    });
    mockGetAddress.mockResolvedValue("WalletAgent111");
    mockListProjects.mockResolvedValue([AGENT_PROJECT]);
    mockGetProject.mockResolvedValue(AGENT_PROJECT_DETAILS);
    mockInitializeCheckout.mockResolvedValue(INIT_RESPONSE);
    mockPayPaymentIntent.mockResolvedValue("tx-topup-sig");
    mockPollCheckoutCompletion.mockResolvedValue(POLL_COMPLETED);
  });

  it("completes happy path for agent project, sourcing priceId from getProject", async () => {
    const result = await purchaseCredits(secretKey, "jwt", {
      projectId: "proj-agent",
    });

    expect(result.status).toBe("completed");
    expect(result.txSignature).toBe("tx-topup-sig");
    expect(result.paymentIntentId).toBe("pi_topup");
    expect(result.amountCents).toBe(1000);

    // priceId comes from getProject(...).prepaidCreditsPriceId
    expect(mockGetProject).toHaveBeenCalledWith("jwt", "proj-agent", undefined);
    expect(mockInitializeCheckout).toHaveBeenCalledWith(
      "jwt",
      expect.objectContaining({
        priceId: "price_prepaid_10",
        refId: "proj-agent",
        qty: 1,
        paymentMode: "sponsored",
        signupWalletAddress: "WalletAgent111",
        walletAddress: "WalletAgent111",
      }),
      undefined
    );

    // Sponsored payment flow receives jwt (enables sponsored-first attempt)
    expect(mockPayPaymentIntent).toHaveBeenCalledWith(
      secretKey,
      INIT_RESPONSE,
      "jwt",
      undefined
    );
  });

  it("rejects non-agent projects in pre-flight before /checkout/initialize", async () => {
    mockListProjects.mockResolvedValue([DEVELOPER_PROJECT]);

    await expect(
      purchaseCredits(secretKey, "jwt", { projectId: "proj-dev" })
    ).rejects.toThrow(/only supported for agent-plan projects/);

    expect(mockGetProject).not.toHaveBeenCalled();
    expect(mockInitializeCheckout).not.toHaveBeenCalled();
    expect(mockPayPaymentIntent).not.toHaveBeenCalled();
  });

  it("rejects when project is not found for this user", async () => {
    mockListProjects.mockResolvedValue([AGENT_PROJECT]);

    await expect(
      purchaseCredits(secretKey, "jwt", { projectId: "proj-other" })
    ).rejects.toThrow(/not found for this authenticated user/);
  });

  it.each([0, -1, 1.5, NaN])(
    "rejects non-positive-integer qty (%s) before any network calls",
    async (badQty) => {
      await expect(
        purchaseCredits(secretKey, "jwt", {
          projectId: "proj-agent",
          qty: badQty,
        })
      ).rejects.toThrow(/`qty` must be a positive integer/);

      expect(mockListProjects).not.toHaveBeenCalled();
      expect(mockGetProject).not.toHaveBeenCalled();
      expect(mockInitializeCheckout).not.toHaveBeenCalled();
    }
  );

  it("forwards qty > 1 to initializeCheckout", async () => {
    await purchaseCredits(secretKey, "jwt", {
      projectId: "proj-agent",
      qty: 3,
    });

    expect(mockInitializeCheckout).toHaveBeenCalledWith(
      "jwt",
      expect.objectContaining({ qty: 3 }),
      undefined
    );
  });

  it("throws when project has no prepaidCreditsPriceId", async () => {
    mockGetProject.mockResolvedValue({
      apiKeys: [],
      creditsUsage: {} as never,
      billingCycle: {} as never,
      subscriptionPlanDetails: {} as never,
      prepaidCreditsLink: "",
      // prepaidCreditsPriceId intentionally omitted
    } as never);

    await expect(
      purchaseCredits(secretKey, "jwt", { projectId: "proj-agent" })
    ).rejects.toThrow(/does not expose a prepaid-credits priceId/);
  });

  it("returns failed status when payPaymentIntent throws", async () => {
    mockPayPaymentIntent.mockRejectedValue(new Error("boom"));

    const result = await purchaseCredits(secretKey, "jwt", {
      projectId: "proj-agent",
    });

    expect(result.status).toBe("failed");
    expect(result.txSignature).toBeNull();
    expect(result.error).toBe("boom");
  });

  it("returns expired status when polling reports expired phase", async () => {
    mockPollCheckoutCompletion.mockResolvedValue({
      status: "expired",
      phase: "expired",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "Payment intent expired",
    } as never);

    const result = await purchaseCredits(secretKey, "jwt", {
      projectId: "proj-agent",
    });

    expect(result.status).toBe("expired");
    expect(result.txSignature).toBe("tx-topup-sig");
  });

  it("returns timeout status when polling does not reach readyToRedirect", async () => {
    mockPollCheckoutCompletion.mockResolvedValue({
      status: "pending",
      phase: "confirming",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "Still waiting",
    } as never);

    const result = await purchaseCredits(secretKey, "jwt", {
      projectId: "proj-agent",
    });

    expect(result.status).toBe("timeout");
  });
});
