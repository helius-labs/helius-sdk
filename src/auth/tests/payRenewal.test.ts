jest.mock("../checkout", () => ({
  getPaymentIntent: jest.fn(),
  getPaymentStatus: jest.fn(),
}));
jest.mock("../payPaymentLink", () => ({
  payPaymentLink: jest.fn().mockResolvedValue({ txSignature: "tx-renew" }),
}));

import { payRenewal, payRenewalAndPay } from "../payRenewal";
import { getPaymentIntent, getPaymentStatus } from "../checkout";
import { payPaymentLink } from "../payPaymentLink";

const mockGetPaymentIntent = getPaymentIntent as jest.MockedFunction<
  typeof getPaymentIntent
>;
const mockGetPaymentStatus = getPaymentStatus as jest.MockedFunction<
  typeof getPaymentStatus
>;
const mockPayPaymentLink = payPaymentLink as jest.MockedFunction<
  typeof payPaymentLink
>;

const intent = (status: "pending" | "completed" | "expired" | "failed") => ({
  id: "pi_renew",
  status,
  amount: 4900,
  destinationWallet: "Treasury",
  solanaPayUrl: "solana:Treasury?amount=49",
  expiresAt: "2027-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  priceId: "price_developer_monthly",
  refId: "proj-1",
});

describe("payRenewal — link mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("wraps an existing pending renewal intent as a PaymentLink", async () => {
    mockGetPaymentIntent.mockResolvedValue(intent("pending"));

    const result = await payRenewal("jwt-1", "pi_renew");

    expect(result.kind).toBe("payment_required");
    expect(result.paymentLink.paymentIntentId).toBe("pi_renew");
    expect(result.paymentLink.amountCents).toBe(4900);
    expect(result.paymentLink.memo).toBe("pi_renew");
    expect(result.paymentLink.paymentUrl).toContain("/pay/pi_renew");
    expect(result.paymentLink.planName).toBe("Subscription renewal");
  });

  it("rejects non-pending intents", async () => {
    mockGetPaymentIntent.mockResolvedValue(intent("completed"));
    await expect(payRenewal("jwt-1", "pi_renew")).rejects.toThrow(
      /completed.*only pending/
    );
  });

  it("paymentHost override flows into the URL", async () => {
    mockGetPaymentIntent.mockResolvedValue(intent("pending"));
    const result = await payRenewal("jwt-1", "pi_renew", {
      paymentHost: "https://staging.example",
    });
    expect(result.paymentLink.paymentUrl).toBe(
      "https://staging.example/pay/pi_renew"
    );
  });
});

describe("payRenewalAndPay", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pays + polls + returns completed (renewal flips to ready on payment confirmation alone)", async () => {
    mockGetPaymentIntent.mockResolvedValue(intent("pending"));
    mockGetPaymentStatus.mockResolvedValue({
      status: "completed",
      phase: "complete",
      subscriptionActive: true,
      readyToRedirect: true,
      message: "ok",
    });

    const result = await payRenewalAndPay(
      new Uint8Array(64),
      "jwt-1",
      "pi_renew"
    );

    expect(result.kind).toBe("completed");
    if (result.kind !== "completed") throw new Error();
    expect(result.txSignature).toBe("tx-renew");
    expect(mockPayPaymentLink).toHaveBeenCalledTimes(1);
  });

  it("returns failed on terminal failed phase", async () => {
    mockGetPaymentIntent.mockResolvedValue(intent("pending"));
    mockGetPaymentStatus.mockResolvedValue({
      status: "failed",
      phase: "failed",
      subscriptionActive: false,
      readyToRedirect: false,
      message: "boom",
    });

    const result = await payRenewalAndPay(
      new Uint8Array(64),
      "jwt-1",
      "pi_renew"
    );
    expect(result.kind).toBe("failed");
  });
});
