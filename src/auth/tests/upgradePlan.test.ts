jest.mock("../checkout", () => ({
  resolvePriceId: jest.fn().mockResolvedValue("price_business_monthly"),
  initializeCheckout: jest.fn(),
  getCheckoutPreview: jest.fn(),
  getPaymentStatus: jest.fn(),
}));
jest.mock("../payPaymentLink", () => ({
  payPaymentLink: jest.fn().mockResolvedValue({ txSignature: "tx-up" }),
}));

import { upgradePlan, upgradePlanAndPay } from "../upgradePlan";
import {
  initializeCheckout,
  getCheckoutPreview,
  getPaymentStatus,
} from "../checkout";
import { payPaymentLink } from "../payPaymentLink";

const mockInitializeCheckout = initializeCheckout as jest.MockedFunction<
  typeof initializeCheckout
>;
const mockGetCheckoutPreview = getCheckoutPreview as jest.MockedFunction<
  typeof getCheckoutPreview
>;
const mockGetPaymentStatus = getPaymentStatus as jest.MockedFunction<
  typeof getPaymentStatus
>;
const mockPayPaymentLink = payPaymentLink as jest.MockedFunction<
  typeof payPaymentLink
>;

const intent = {
  id: "pi_upgrade",
  status: "pending" as const,
  amount: 49900,
  destinationWallet: "Treasury",
  solanaPayUrl: "solana:...",
  expiresAt: "2027-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  priceId: "price_business_monthly",
  refId: "proj-1",
};

const baseOpts = {
  jwt: "jwt-1",
  projectId: "proj-1",
  plan: "business" as const,
};

describe("upgradePlan — link mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a PaymentLink with refId=projectId and self_funded mode", async () => {
    mockGetCheckoutPreview.mockResolvedValue({
      planName: "Business",
      period: "monthly",
      baseAmount: 49900,
      subtotal: 49900,
      appliedCredits: 0,
      proratedCredits: 0,
      discounts: 0,
      dueToday: 49900,
      destinationWallet: "Treasury",
      note: "",
    });
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await upgradePlan(baseOpts);

    expect(result.kind).toBe("payment_required");
    expect(result.paymentLink.paymentIntentId).toBe("pi_upgrade");
    expect(mockInitializeCheckout).toHaveBeenCalledWith(
      "jwt-1",
      expect.objectContaining({
        priceId: "price_business_monthly",
        refId: "proj-1",
        paymentMode: "self_funded",
      })
    );
  });

  it("does not require contact info (backend auto-fetches from existing customer)", async () => {
    mockGetCheckoutPreview.mockRejectedValue(
      new Error("API error (400): Customer ID is required for one time preview")
    );
    mockInitializeCheckout.mockResolvedValue(intent);

    const result = await upgradePlan(baseOpts);
    expect(result.kind).toBe("payment_required");
    // No email/firstName/lastName passed in baseOpts — backend fetches from customer.
  });
});

describe("upgradePlanAndPay", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pays + polls + returns completed", async () => {
    mockGetCheckoutPreview.mockResolvedValue({
      planName: "Business",
      period: "monthly",
      baseAmount: 49900,
      subtotal: 49900,
      appliedCredits: 0,
      proratedCredits: 0,
      discounts: 0,
      dueToday: 49900,
      destinationWallet: "Treasury",
      note: "",
    });
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "completed",
      phase: "complete",
      subscriptionActive: true,
      readyToRedirect: true,
      message: "ok",
    });

    const result = await upgradePlanAndPay({
      ...baseOpts,
      secretKey: new Uint8Array(64),
    });

    expect(result.kind).toBe("completed");
    if (result.kind !== "completed") throw new Error();
    expect(result.txSignature).toBe("tx-up");
    expect(mockPayPaymentLink).toHaveBeenCalledTimes(1);
  });

  it("returns expired on terminal expired phase", async () => {
    mockGetCheckoutPreview.mockResolvedValue({
      planName: "Business",
      period: "monthly",
      baseAmount: 49900,
      subtotal: 49900,
      appliedCredits: 0,
      proratedCredits: 0,
      discounts: 0,
      dueToday: 49900,
      destinationWallet: "Treasury",
      note: "",
    });
    mockInitializeCheckout.mockResolvedValue(intent);
    mockGetPaymentStatus.mockResolvedValue({
      status: "expired",
      phase: "expired",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "expired",
    });

    const result = await upgradePlanAndPay({
      ...baseOpts,
      secretKey: new Uint8Array(64),
    });
    expect(result.kind).toBe("expired");
  });
});
