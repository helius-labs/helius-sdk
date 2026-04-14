import { makeAdminClient } from "../client";
import { makeAdminClientEager } from "../client.eager";
import { ADMIN_API_URL } from "../constants";
import type { ProjectUsage } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("makeAdminClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports a direct admin client with getProjectUsage", () => {
    const admin = makeAdminClient("test-key");

    expect(typeof admin.getProjectUsage).toBe("function");
  });

  it("calls the admin usage endpoint directly via the eager client", async () => {
    const admin = makeAdminClientEager("test-key", "helius-sdk-tests/1.0.0");

    const mockUsage: ProjectUsage = {
      creditsRemaining: 999080,
      creditsUsed: 920,
      prepaidCreditsRemaining: 5000,
      prepaidCreditsUsed: 120,
      subscriptionDetails: {
        billingCycle: { start: "2026-04-01", end: "2026-05-01" },
        creditsLimit: 1000000,
        plan: "developer",
      },
      usage: {
        api: 0,
        archival: 0,
        das: 50,
        grpc: 0,
        grpcGeyser: 0,
        photon: 0,
        rpc: 310,
        stream: 0,
        webhook: 20,
        websocket: 0,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUsage,
    });

    const result = await admin.getProjectUsage("proj-123");

    expect(result).toEqual(mockUsage);
    expect(mockFetch).toHaveBeenCalledWith(
      `${ADMIN_API_URL}/admin/projects/proj-123/usage`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Api-Key": "test-key",
          "X-Helius-Client": "helius-sdk-tests/1.0.0",
        }),
      })
    );
  });
});
