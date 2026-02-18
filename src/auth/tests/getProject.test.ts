import { getProject } from "../getProject";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("getProject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends GET to /projects/:id with Authorization header", async () => {
    const mockDetails = {
      apiKeys: [{ keyId: "key-1" }],
      creditsUsage: { remainingCredits: 500000 },
      billingCycle: { start: "2025-01-01", end: "2025-02-01" },
      subscriptionPlanDetails: {
        currentPlan: "free",
        upcomingPlan: "free",
        isUpgrading: false,
      },
      prepaidCreditsLink: "https://example.com",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDetails,
    });

    const result = await getProject("jwt-token", "proj-123");

    expect(result).toEqual(mockDetails);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.helius.xyz/v0/projects/proj-123",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      })
    );
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found",
    });

    await expect(getProject("jwt", "bad-id")).rejects.toThrow(
      "API error (404): Not Found"
    );
  });
});
