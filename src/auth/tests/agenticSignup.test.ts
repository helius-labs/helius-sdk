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
  executeUpgrade: jest.fn().mockResolvedValue({
    paymentIntentId: "pi_upgrade",
    txSignature: "tx-upgrade-123",
    status: "completed",
  }),
}));

import { agenticSignup } from "../agenticSignup";
import { listProjects } from "../listProjects";
import { walletSignup } from "../walletSignup";
import { executeCheckout, executeUpgrade } from "../checkout";

const CONTACT = {
  email: "user@example.com",
  firstName: "Test",
  lastName: "User",
};

const EXISTING_PROJECT = {
  id: "proj-existing",
  name: "Existing",
  createdAt: "2025-01-01",
  verifiedEmail: null,
  subscription: {},
  users: [],
  dnsRecords: [],
};

describe("agenticSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Agent plan (new default entry plan) ──

  describe("agent plan (default)", () => {
    it("defaults to agent plan when plan is omitted", async () => {
      const result = await agenticSignup({
        secretKey: new Uint8Array(64),
        ...CONTACT,
      });

      expect(result.status).toBe("success");
      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        expect.objectContaining({
          plan: "agent",
          paymentMode: "sponsored",
        }),
        undefined
      );
    });

    it("treats empty string plan as agent", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "",
        ...CONTACT,
      });

      const callArgs = (executeCheckout as jest.Mock).mock.calls[0];
      expect(callArgs[2].plan).toBe("agent");
    });

    it("requires contact info for new-user agent signup", async () => {
      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "agent" })
      ).rejects.toThrow("Missing: email, firstName, lastName");
    });

    it("uses sponsored paymentMode for agent signups", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "agent",
        ...CONTACT,
      });

      const callArgs = (executeCheckout as jest.Mock).mock.calls[0];
      expect(callArgs[2].paymentMode).toBe("sponsored");
    });
  });

  // ── OpenPay signup (new user) ──

  describe("OpenPay signup (new user)", () => {
    it("uses executeCheckout for developer plan", async () => {
      const result = await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "developer",
        ...CONTACT,
      });

      expect(result.status).toBe("success");
      expect(result.projectId).toBe("proj-new");
      expect(result.apiKey).toBe("key-abc");
      expect(result.txSignature).toBe("tx-sig-abc123");

      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        {
          plan: "developer",
          period: "monthly",
          refId: "ref-1",
          ...CONTACT,
          walletAddress: "WalletAddress123",
          couponCode: undefined,
          paymentMode: "sponsored",
        },
        undefined
      );
    });

    it("passes custom plan, period, couponCode, and email", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "business",
        period: "yearly",
        couponCode: "SAVE10",
        ...CONTACT,
      });

      const callArgs = (executeCheckout as jest.Mock).mock.calls[0];
      expect(callArgs[2].plan).toBe("business");
      expect(callArgs[2].period).toBe("yearly");
      expect(callArgs[2].couponCode).toBe("SAVE10");
      expect(callArgs[2].email).toBe("user@example.com");
    });

    it("always uses sponsored paymentMode for new signups", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "developer",
        ...CONTACT,
      });

      const callArgs = (executeCheckout as jest.Mock).mock.calls[0];
      expect(callArgs[2].paymentMode).toBe("sponsored");
    });

    it("throws when checkout fails and includes error reason", async () => {
      (executeCheckout as jest.Mock).mockResolvedValueOnce({
        paymentIntentId: "pi_test",
        txSignature: "tx-sig-abc123",
        status: "failed",
        error: "Insufficient USDC",
      });

      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "developer",
          ...CONTACT,
        })
      ).rejects.toThrow("Checkout failed: Insufficient USDC");
    });

    it("throws when checkout times out and includes tx signature", async () => {
      (executeCheckout as jest.Mock).mockResolvedValueOnce({
        paymentIntentId: "pi_test",
        txSignature: "tx-sig-timeout",
        status: "timeout",
      });

      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "developer",
          ...CONTACT,
        })
      ).rejects.toThrow("TX: tx-sig-timeout");
    });

    it("passes userAgent to executeCheckout", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "developer",
        userAgent: "test-agent/1.0",
        ...CONTACT,
      });

      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        {
          plan: "developer",
          period: "monthly",
          refId: "ref-1",
          ...CONTACT,
          walletAddress: "WalletAddress123",
          couponCode: undefined,
          paymentMode: "sponsored",
        },
        "test-agent/1.0"
      );
    });

    it("throws when contact info missing for new user on paid plan", async () => {
      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "developer" })
      ).rejects.toThrow("Missing: email, firstName, lastName");
    });

    it("throws listing specific missing fields", async () => {
      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "developer",
          email: "a@b.com",
        })
      ).rejects.toThrow("Missing: firstName, lastName");
    });
  });

  // ── Pre-authenticated session reuse ──

  describe("pre-authenticated session (jwt + refId)", () => {
    it("skips walletSignup when jwt + refId are supplied", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "developer",
        jwt: "preauth-jwt",
        refId: "preauth-ref",
        ...CONTACT,
      });

      expect(walletSignup).not.toHaveBeenCalled();
      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "preauth-jwt",
        expect.objectContaining({ refId: "preauth-ref", plan: "developer" }),
        undefined
      );
    });

    it("throws when only jwt is supplied (no refId)", async () => {
      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "developer",
          jwt: "preauth-jwt",
          ...CONTACT,
        })
      ).rejects.toThrow("pass both `jwt` and `refId` together");
    });

    it("throws when only refId is supplied (no jwt)", async () => {
      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "developer",
          refId: "preauth-ref",
          ...CONTACT,
        })
      ).rejects.toThrow("pass both `jwt` and `refId` together");
    });

    it("calls walletSignup normally when neither is supplied", async () => {
      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "developer",
        ...CONTACT,
      });

      expect(walletSignup).toHaveBeenCalledTimes(1);
    });
  });

  // ── Existing user + paid plan → upgrade ──

  describe("existing user + paid plan (upgrade)", () => {
    it("calls executeCheckout for existing user with paid plan", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);

      const result = await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "business",
        period: "yearly",
        couponCode: "UPGRADE10",
        ...CONTACT,
      });

      expect(result.status).toBe("upgraded");
      expect(result.projectId).toBe("proj-existing");
      expect(result.apiKey).toBe("key-abc");
      expect(result.txSignature).toBe("tx-sig-abc123");
      expect(result.credits).toBeNull();

      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        {
          plan: "business",
          period: "yearly",
          refId: "proj-existing",
          couponCode: "UPGRADE10",
          ...CONTACT,
        },
        undefined,
        { skipProjectPolling: true }
      );
      expect(executeUpgrade).not.toHaveBeenCalled();
    });

    it("calls executeCheckout without customer info for existing user", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);

      const result = await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "business",
        period: "yearly",
        couponCode: "UPGRADE10",
      });

      expect(result.status).toBe("upgraded");

      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        {
          plan: "business",
          period: "yearly",
          refId: "proj-existing",
          couponCode: "UPGRADE10",
          email: undefined,
          firstName: undefined,
          lastName: undefined,
        },
        undefined,
        { skipProjectPolling: true }
      );
      expect(executeUpgrade).not.toHaveBeenCalled();
    });

    it("does not set paymentMode for upgrades (backend blocks sponsored)", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);

      await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "business",
      });

      const callArgs = (executeCheckout as jest.Mock).mock.calls[0];
      expect(callArgs[2].paymentMode).toBeUndefined();
    });

    it("existing user + agent plan routes through upgrade flow", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);

      const result = await agenticSignup({
        secretKey: new Uint8Array(64),
        plan: "agent",
        ...CONTACT,
      });

      expect(result.status).toBe("upgraded");
      expect(executeCheckout).toHaveBeenCalledWith(
        new Uint8Array(64),
        "jwt-token-123",
        expect.objectContaining({
          plan: "agent",
          refId: "proj-existing",
        }),
        undefined,
        { skipProjectPolling: true }
      );
    });

    it("throws on partial customer info for existing user upgrade", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);

      await expect(
        agenticSignup({
          secretKey: new Uint8Array(64),
          plan: "business",
          email: "user@example.com",
        })
      ).rejects.toThrow("Missing: firstName, lastName");
    });

    it("throws when upgrade fails and includes error reason", async () => {
      (listProjects as jest.Mock).mockResolvedValueOnce([EXISTING_PROJECT]);
      (executeCheckout as jest.Mock).mockResolvedValueOnce({
        paymentIntentId: "pi_upgrade",
        txSignature: null,
        status: "failed",
        error: "Cannot downgrade from professional_v4 to business_v4",
      });

      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "professional" })
      ).rejects.toThrow("Checkout failed: Cannot downgrade");
    });
  });

  // ── Validation ──

  describe("validation", () => {
    it("throws on unknown plan", async () => {
      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "enterprise" })
      ).rejects.toThrow("Unknown plan: enterprise");
    });

    it("rejects basic (removed from supported set)", async () => {
      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "basic" })
      ).rejects.toThrow("Unknown plan: basic");
    });

    it("throws on unknown plan with available plans listed", async () => {
      await expect(
        agenticSignup({ secretKey: new Uint8Array(64), plan: "invalid" })
      ).rejects.toThrow("Available: developer, business, professional, agent");
    });
  });
});
