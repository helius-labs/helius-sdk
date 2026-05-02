jest.mock("../payWithMemo", () => ({
  payWithMemo: jest.fn().mockResolvedValue("tx-sig-abc"),
}));

import { payPaymentLink } from "../payPaymentLink";
import { payWithMemo } from "../payWithMemo";
import type { PaymentLink } from "../types";

const mockPayWithMemo = payWithMemo as jest.MockedFunction<typeof payWithMemo>;

const link = (overrides: Partial<PaymentLink> = {}): PaymentLink => ({
  kind: "payment_required",
  paymentIntentId: "pi_abc",
  amountCents: 1000, // $10
  destinationWallet: "Treasury111",
  memo: "pi_abc",
  expiresAt: "2026-12-31T00:00:00Z",
  paymentUrl: "https://dashboard.helius.dev/pay/pi_abc",
  solanaPayUrl: "solana:Treasury111?amount=10",
  planName: "Agent Plan",
  ...overrides,
});

describe("payPaymentLink", () => {
  beforeEach(() => mockPayWithMemo.mockClear());

  it("converts amountCents to USDC raw units (× 10_000)", async () => {
    const sk = new Uint8Array(64);
    await payPaymentLink(sk, link({ amountCents: 1000 }));
    expect(mockPayWithMemo).toHaveBeenCalledWith(
      sk,
      "Treasury111",
      10_000_000n, // 1000 cents × 10_000 = 10 USDC raw
      "pi_abc"
    );
  });

  it("uses paymentIntentId as the on-chain memo", async () => {
    await payPaymentLink(
      new Uint8Array(64),
      link({ paymentIntentId: "pi_xyz" })
    );
    expect(mockPayWithMemo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "pi_xyz"
    );
  });

  it("returns the txSignature from payWithMemo", async () => {
    const result = await payPaymentLink(new Uint8Array(64), link());
    expect(result).toEqual({ txSignature: "tx-sig-abc" });
  });

  it("handles large amounts without precision loss", async () => {
    await payPaymentLink(new Uint8Array(64), link({ amountCents: 99_900 })); // $999
    expect(mockPayWithMemo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      999_000_000n,
      expect.anything()
    );
  });
});
