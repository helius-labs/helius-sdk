import { createProject } from "../createProject";
import { API_URL } from "../constants";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("createProject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends POST to /projects/create with Authorization header", async () => {
    const mockProject = { id: "proj-new", name: "New Project" };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProject,
    });

    const result = await createProject("jwt-token");

    expect(result).toEqual(mockProject);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/projects/create`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
        body: JSON.stringify({}),
      })
    );
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(createProject("jwt")).rejects.toThrow(
      "API error (500): Internal Server Error"
    );
  });
});
