jest.mock("../loadKeypair", () => ({
  loadKeypair: jest.fn(() => ({
    publicKey: new Uint8Array(32),
    secretKey: new Uint8Array(64),
  })),
}));

jest.mock("../getAddress", () => ({
  getAddress: jest.fn().mockResolvedValue("WalletAddress123"),
}));

jest.mock("../signAuthMessage", () => ({
  signAuthMessage: jest.fn().mockResolvedValue({
    message: "auth-msg",
    signature: "auth-sig",
  }),
}));

jest.mock("../walletSignup", () => ({
  walletSignup: jest.fn().mockResolvedValue({
    token: "jwt-token-123",
    refId: "ref-1",
    newUser: true,
  }),
}));

jest.mock("../listProjects", () => ({
  listProjects: jest.fn().mockResolvedValue([]),
}));

jest.mock("../getProject", () => ({
  getProject: jest.fn().mockResolvedValue({
    apiKeys: [{ keyId: "key-abc" }],
    creditsUsage: { remainingCredits: 1000000 },
    billingCycle: { start: "2025-01-01", end: "2025-02-01" },
    subscriptionPlanDetails: {
      currentPlan: "free",
      upcomingPlan: "free",
      isUpgrading: false,
    },
    prepaidCreditsLink: "",
  }),
}));

jest.mock("../checkout", () => ({
  executeCheckout: jest.fn().mockResolvedValue({
    paymentIntentId: "pi_test",
    txSignature: "tx-sig-abc123",
    status: "completed",
    projectId: "proj-new",
    apiKey: "key-abc",
  }),
}));

import { agenticSignup } from "../agenticSignup";
import { listProjects } from "../listProjects";
import { executeCheckout } from "../checkout";

describe("agenticSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new project when none exist", async () => {
    const result = await agenticSignup({ secretKey: new Uint8Array(64) });

    expect(result.status).toBe("success");
    expect(result.jwt).toBe("jwt-token-123");
    expect(result.walletAddress).toBe("WalletAddress123");
    expect(result.projectId).toBe("proj-new");
    expect(result.apiKey).toBe("key-abc");
    expect(result.txSignature).toBe("tx-sig-abc123");
    expect(result.endpoints).toEqual({
      mainnet: "https://mainnet.helius-rpc.com/?api-key=key-abc",
      devnet: "https://devnet.helius-rpc.com/?api-key=key-abc",
    });
    expect(executeCheckout).toHaveBeenCalledWith(
      new Uint8Array(64),
      "jwt-token-123",
      { paymentType: "subscription" },
      undefined
    );
  });

  it("returns existing project when one exists", async () => {
    (listProjects as jest.Mock).mockResolvedValueOnce([
      {
        id: "proj-existing",
        name: "Existing",
        createdAt: "2025-01-01",
        verifiedEmail: null,
        subscription: {},
        users: [],
        dnsRecords: [],
      },
    ]);

    const result = await agenticSignup({ secretKey: new Uint8Array(64) });

    expect(result.status).toBe("existing_project");
    expect(result.projectId).toBe("proj-existing");
    expect(executeCheckout).not.toHaveBeenCalled();
  });

  it("throws when checkout fails", async () => {
    (executeCheckout as jest.Mock).mockResolvedValueOnce({
      paymentIntentId: "pi_test",
      txSignature: "tx-sig-abc123",
      status: "failed",
    });

    await expect(
      agenticSignup({ secretKey: new Uint8Array(64) })
    ).rejects.toThrow("Checkout failed");
  });

  it("throws when checkout times out and includes tx signature", async () => {
    (executeCheckout as jest.Mock).mockResolvedValueOnce({
      paymentIntentId: "pi_test",
      txSignature: "tx-sig-timeout",
      status: "timeout",
    });

    await expect(
      agenticSignup({ secretKey: new Uint8Array(64) })
    ).rejects.toThrow("TX: tx-sig-timeout");
  });

  it("passes userAgent through", async () => {
    const { walletSignup } = require("../walletSignup");

    await agenticSignup({
      secretKey: new Uint8Array(64),
      userAgent: "test-agent/1.0",
    });

    expect(walletSignup).toHaveBeenCalledWith(
      "auth-msg",
      "auth-sig",
      "WalletAddress123",
      "test-agent/1.0"
    );

    expect(executeCheckout).toHaveBeenCalledWith(
      new Uint8Array(64),
      "jwt-token-123",
      { paymentType: "subscription" },
      "test-agent/1.0"
    );
  });
});
