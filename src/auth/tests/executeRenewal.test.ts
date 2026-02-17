import { executeRenewal } from "../checkout";
import { authRequest } from "../utils";
import { checkSolBalance, checkUsdcBalance } from "../checkBalances";
import { payWithMemo } from "../payWithMemo";
import { loadKeypair } from "../loadKeypair";
import { getAddress } from "../getAddress";

jest.mock("../utils");
jest.mock("../checkBalances");
jest.mock("../payWithMemo");
jest.mock("../loadKeypair");
jest.mock("../getAddress");

jest.mock("../constants", () => ({
  ...jest.requireActual("../constants"),
  CHECKOUT_POLL_INTERVAL_MS: 10,
  CHECKOUT_POLL_TIMEOUT_MS: 100,
}));

const mockAuthRequest = authRequest as jest.MockedFunction<typeof authRequest>;
const mockPayWithMemo = payWithMemo as jest.MockedFunction<typeof payWithMemo>;
const mockLoadKeypair = loadKeypair as jest.MockedFunction<typeof loadKeypair>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;

const mockSecretKey = new Uint8Array(64).fill(1);

const PENDING_INTENT = {
  id: "pi_renewal",
  status: "pending",
  destinationWallet: "Treasury111",
  amount: 4900,
  solanaPayUrl: "solana:...",
  expiresAt: "2026-01-01T00:00:00Z",
  createdAt: "2025-12-01T00:00:00Z",
  priceId: "price_stg_EZrAwZiew077g1qd",
  refId: "proj-1",
};

describe("executeRenewal", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockLoadKeypair.mockReturnValue({
      publicKey: new Uint8Array(32),
      secretKey: mockSecretKey,
    });
    mockGetAddress.mockResolvedValue("WalletAddress111");
    (checkSolBalance as jest.Mock).mockResolvedValue(10_000_000n);
    (checkUsdcBalance as jest.Mock).mockResolvedValue(50_000_000n);
    mockPayWithMemo.mockResolvedValue("tx-sig-renewal");
  });

  it("fetches existing intent, pays, and polls", async () => {
    mockAuthRequest
      .mockResolvedValueOnce(PENDING_INTENT) // getPaymentIntent
      .mockResolvedValueOnce({ // pollCheckoutCompletion
        status: "completed",
        phase: "complete",
        subscriptionActive: true,
        readyToRedirect: true,
        message: "Success",
      });

    const result = await executeRenewal(mockSecretKey, "jwt", "pi_renewal");

    expect(result.status).toBe("completed");
    expect(result.paymentIntentId).toBe("pi_renewal");
    expect(result.txSignature).toBe("tx-sig-renewal");
  });

  it("throws if intent is not pending", async () => {
    mockAuthRequest.mockResolvedValueOnce({
      ...PENDING_INTENT,
      status: "expired",
    });

    await expect(
      executeRenewal(mockSecretKey, "jwt", "pi_renewal")
    ).rejects.toThrow("Payment intent is expired, cannot pay");
  });

  it("throws if intent is completed", async () => {
    mockAuthRequest.mockResolvedValueOnce({
      ...PENDING_INTENT,
      status: "completed",
    });

    await expect(
      executeRenewal(mockSecretKey, "jwt", "pi_renewal")
    ).rejects.toThrow("Payment intent is completed, cannot pay");
  });

  it("returns failed on payment error", async () => {
    mockAuthRequest.mockResolvedValueOnce(PENDING_INTENT);
    mockPayWithMemo.mockRejectedValue(new Error("TX failed"));

    const result = await executeRenewal(mockSecretKey, "jwt", "pi_renewal");

    expect(result.status).toBe("failed");
    expect(result.error).toBe("TX failed");
  });
});
