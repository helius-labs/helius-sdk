import { pollUntilTerminal } from "../pollPayment";
import { getPaymentStatus } from "../checkout";

jest.mock("../checkout");

jest.mock("../constants", () => ({
  ...jest.requireActual("../constants"),
  CHECKOUT_POLL_INTERVAL_MS: 5,
  CHECKOUT_POLL_TIMEOUT_MS: 50,
}));

const mockGetPaymentStatus = getPaymentStatus as jest.MockedFunction<
  typeof getPaymentStatus
>;

const baseStatus = {
  status: "pending" as const,
  phase: "confirming" as const,
  subscriptionActive: false,
  readyToRedirect: false,
  message: "",
};

describe("pollUntilTerminal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns completed when readyToRedirect flips true", async () => {
    mockGetPaymentStatus.mockResolvedValueOnce({
      ...baseStatus,
      readyToRedirect: true,
      status: "completed",
    });

    const outcome = await pollUntilTerminal("jwt", "intent-1");
    expect(outcome.kind).toBe("completed");
    if (outcome.kind === "completed") {
      expect(outcome.status.readyToRedirect).toBe(true);
    }
  });

  it("returns expired when phase === expired", async () => {
    mockGetPaymentStatus.mockResolvedValueOnce({
      ...baseStatus,
      phase: "expired",
      status: "expired",
    });

    const outcome = await pollUntilTerminal("jwt", "intent-2");
    expect(outcome.kind).toBe("expired");
    if (outcome.kind === "expired") {
      expect(outcome.status?.phase).toBe("expired");
    }
  });

  it("returns expired when getPaymentStatus throws an HTTP 410", async () => {
    mockGetPaymentStatus.mockRejectedValueOnce(
      new Error("API error (410): gone")
    );

    const outcome = await pollUntilTerminal("jwt", "intent-3");
    expect(outcome.kind).toBe("expired");
    if (outcome.kind === "expired") {
      expect(outcome.status).toBeUndefined();
    }
  });

  it("rethrows non-410 errors from getPaymentStatus", async () => {
    mockGetPaymentStatus.mockRejectedValueOnce(
      new Error("API error (500): boom")
    );

    await expect(pollUntilTerminal("jwt", "intent-4")).rejects.toThrow(
      "API error (500): boom"
    );
  });

  it("does not match the literal substring '410' in unrelated error messages", async () => {
    mockGetPaymentStatus.mockRejectedValueOnce(
      new Error("API error (400): tx 410xyz")
    );

    await expect(pollUntilTerminal("jwt", "intent-4b")).rejects.toThrow(
      "API error (400): tx 410xyz"
    );
  });

  it("returns failed when phase === failed and surfaces message", async () => {
    mockGetPaymentStatus.mockResolvedValueOnce({
      ...baseStatus,
      phase: "failed",
      status: "failed",
      message: "card declined",
    });

    const outcome = await pollUntilTerminal("jwt", "intent-5");
    expect(outcome.kind).toBe("failed");
    if (outcome.kind === "failed") {
      expect(outcome.status.message).toBe("card declined");
    }
  });

  it("returns timeout when deadline elapses without a terminal phase", async () => {
    mockGetPaymentStatus.mockResolvedValue({ ...baseStatus });

    const outcome = await pollUntilTerminal("jwt", "intent-6");
    expect(outcome.kind).toBe("timeout");
    expect(mockGetPaymentStatus).toHaveBeenCalled();
  });
});
