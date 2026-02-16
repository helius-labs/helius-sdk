import {
  initializeCheckout,
  pollCheckoutCompletion,
  executeCheckout,
} from "../checkout";
import { authRequest } from "../utils";
import { checkSolBalance, checkUsdcBalance } from "../checkBalances";
import { payWithMemo } from "../payWithMemo";
import { listProjects } from "../listProjects";
import { getProject } from "../getProject";
import { loadKeypair } from "../loadKeypair";
import { getAddress } from "../getAddress";

jest.mock("../utils");
jest.mock("../checkBalances");
jest.mock("../payWithMemo");
jest.mock("../listProjects");
jest.mock("../getProject");
jest.mock("../loadKeypair");
jest.mock("../getAddress");

// Mock polling constants to make tests fast
jest.mock("../constants", () => ({
  ...jest.requireActual("../constants"),
  CHECKOUT_POLL_INTERVAL_MS: 10,
  CHECKOUT_POLL_TIMEOUT_MS: 100,
  PROJECT_POLL_INTERVAL_MS: 10,
  PROJECT_POLL_TIMEOUT_MS: 100,
}));

const mockAuthRequest = authRequest as jest.MockedFunction<typeof authRequest>;
const mockCheckSolBalance = checkSolBalance as jest.MockedFunction<
  typeof checkSolBalance
>;
const mockCheckUsdcBalance = checkUsdcBalance as jest.MockedFunction<
  typeof checkUsdcBalance
>;
const mockPayWithMemo = payWithMemo as jest.MockedFunction<typeof payWithMemo>;
const mockListProjects = listProjects as jest.MockedFunction<
  typeof listProjects
>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockLoadKeypair = loadKeypair as jest.MockedFunction<typeof loadKeypair>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;

const INIT_RESPONSE = {
  paymentIntentId: "pi_test",
  treasuryWallet: "Treasury111",
  amount: 1.0,
  memo: "pi_test",
  solanaPayUrl: "solana:...",
  expiresAt: "2026-01-01T00:00:00Z",
};

const POLL_COMPLETED_RESPONSE = {
  paymentIntentId: "pi_test",
  status: "completed",
  txSignature: "tx-sig-abc",
};

describe("initializeCheckout", () => {
  beforeEach(() => jest.resetAllMocks());

  it("sends POST to /checkout/initialize with JWT and request body", async () => {
    const mockResponse = {
      paymentIntentId: "pi_123",
      treasuryWallet: "Treasury111",
      amount: 1.0,
      memo: "pi_123",
      solanaPayUrl: "solana:...",
      expiresAt: "2026-01-01T00:00:00Z",
    };
    mockAuthRequest.mockResolvedValue(mockResponse);

    const result = await initializeCheckout(
      "jwt-token",
      { paymentType: "subscription" },
      "test-agent"
    );

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/initialize",
      {
        method: "POST",
        headers: { Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ paymentType: "subscription" }),
      },
      "test-agent"
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("pollCheckoutCompletion", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns immediately on completed status", async () => {
    mockAuthRequest.mockResolvedValue({
      paymentIntentId: "pi_123",
      status: "completed",
      txSignature: "sig123",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.status).toBe("completed");
    expect(mockAuthRequest).toHaveBeenCalledTimes(1);
  });

  it("returns immediately on failed status", async () => {
    mockAuthRequest.mockResolvedValue({
      paymentIntentId: "pi_123",
      status: "failed",
      failureReason: "insufficient_funds",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.status).toBe("failed");
  });

  it("returns immediately on expired status", async () => {
    mockAuthRequest.mockResolvedValue({
      paymentIntentId: "pi_123",
      status: "expired",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123");
    expect(result.status).toBe("expired");
  });

  it("polls until terminal state", async () => {
    mockAuthRequest
      .mockResolvedValueOnce({ paymentIntentId: "pi_123", status: "pending" })
      .mockResolvedValueOnce({ paymentIntentId: "pi_123", status: "pending" })
      .mockResolvedValueOnce({
        paymentIntentId: "pi_123",
        status: "completed",
      });

    const result = await pollCheckoutCompletion("jwt", "pi_123", undefined, {
      intervalMs: 10,
      timeoutMs: 5000,
    });

    expect(result.status).toBe("completed");
    expect(mockAuthRequest).toHaveBeenCalledTimes(3);
  });

  it("returns pending on timeout", async () => {
    mockAuthRequest.mockResolvedValue({
      paymentIntentId: "pi_123",
      status: "pending",
    });

    const result = await pollCheckoutCompletion("jwt", "pi_123", undefined, {
      intervalMs: 10,
      timeoutMs: 50,
    });

    expect(result.status).toBe("pending");
  });
});

describe("executeCheckout", () => {
  const mockSecretKey = new Uint8Array(64).fill(1);

  function setupDefaultMocks() {
    mockLoadKeypair.mockReturnValue({
      publicKey: new Uint8Array(32),
      secretKey: mockSecretKey,
    });
    mockGetAddress.mockResolvedValue("WalletAddress111111111111111111");
    mockCheckSolBalance.mockResolvedValue(10_000_000n);
    mockCheckUsdcBalance.mockResolvedValue(2_000_000n);
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
      paymentType: "subscription",
    });

    expect(result.status).toBe("completed");
    expect(result.txSignature).toBe("tx-sig-abc");
    expect(result.projectId).toBe("proj-1");
    expect(result.apiKey).toBe("key-123");
    expect(result.paymentIntentId).toBe("pi_test");
  });

  it("throws on insufficient SOL", async () => {
    mockCheckSolBalance.mockResolvedValue(100n);

    await expect(
      executeCheckout(mockSecretKey, "jwt-token", {
        paymentType: "subscription",
      })
    ).rejects.toThrow("Insufficient SOL");
  });

  it("throws on insufficient USDC", async () => {
    mockCheckUsdcBalance.mockResolvedValue(500_000n);

    await expect(
      executeCheckout(mockSecretKey, "jwt-token", {
        paymentType: "subscription",
      })
    ).rejects.toThrow("Insufficient USDC");
  });

  it("returns failed with txSignature null on payment error", async () => {
    mockPayWithMemo.mockRejectedValue(new Error("Transaction failed"));

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      paymentType: "subscription",
    });

    expect(result.status).toBe("failed");
    expect(result.txSignature).toBeNull();
    expect(result.error).toBe("Transaction failed");
  });

  it("returns timeout when payment polling times out", async () => {
    mockAuthRequest.mockReset();
    mockAuthRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      // All subsequent calls return pending (poll never completes)
      .mockResolvedValue({ paymentIntentId: "pi_test", status: "pending" });

    const result = await executeCheckout(mockSecretKey, "jwt-token", {
      paymentType: "subscription",
    });

    expect(result.status).toBe("timeout");
    expect(result.txSignature).toBe("tx-sig-abc");
  });
});
