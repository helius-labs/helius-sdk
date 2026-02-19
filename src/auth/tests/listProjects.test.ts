import { listProjects } from "../listProjects";
import { API_URL } from "../constants";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("listProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends GET to /projects with Authorization header", async () => {
    const mockProjects = [{ id: "proj-1", name: "My Project" }];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    });

    const result = await listProjects("jwt-token");

    expect(result).toEqual(mockProjects);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/projects`,
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
      status: 403,
      text: async () => "Forbidden",
    });

    await expect(listProjects("bad-token")).rejects.toThrow(
      "API error (403): Forbidden"
    );
  });
});
