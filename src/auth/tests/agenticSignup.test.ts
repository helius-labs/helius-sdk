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

jest.mock("../createProject", () => ({
  createProject: jest.fn().mockResolvedValue({
    id: "proj-new",
    name: "New Project",
    apiKeys: [{ keyId: "key-abc" }],
  }),
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

jest.mock("../checkBalances", () => ({
  checkSolBalance: jest.fn().mockResolvedValue(5_000_000_000n),
  checkUsdcBalance: jest.fn().mockResolvedValue(10_000_000n),
}));

jest.mock("../payUSDC", () => ({
  payUSDC: jest.fn().mockResolvedValue("tx-sig-abc123"),
}));

import { agenticSignup } from "../agenticSignup";
import { listProjects } from "../listProjects";
import { checkSolBalance, checkUsdcBalance } from "../checkBalances";
import { payUSDC } from "../payUSDC";

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
    expect(payUSDC).not.toHaveBeenCalled();
  });

  it("throws on insufficient SOL", async () => {
    (checkSolBalance as jest.Mock).mockResolvedValueOnce(0n);

    await expect(
      agenticSignup({ secretKey: new Uint8Array(64) })
    ).rejects.toThrow("Insufficient SOL");
  });

  it("throws on insufficient USDC", async () => {
    (checkUsdcBalance as jest.Mock).mockResolvedValueOnce(0n);

    await expect(
      agenticSignup({ secretKey: new Uint8Array(64) })
    ).rejects.toThrow("Insufficient USDC");
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
  });
});
