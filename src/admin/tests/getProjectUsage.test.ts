import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import { ADMIN_API_URL } from "../constants";
import type { ProjectUsage } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getProjectUsage", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("sends GET to the admin usage endpoint with X-Api-Key auth", async () => {
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

    const result = await rpc.admin.getProjectUsage("proj-123");

    expect(result).toEqual(mockUsage);
    expect(mockFetch).toHaveBeenCalledWith(
      `${ADMIN_API_URL}/admin/projects/proj-123/usage`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Api-Key": "test-key",
        }),
      })
    );
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Admin API is not enabled for this project",
    });

    await expect(rpc.admin.getProjectUsage("proj-123")).rejects.toThrow(
      "API error (403): Admin API is not enabled for this project"
    );
  });
});
