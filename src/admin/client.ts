import type { ProjectUsage } from "./types";

/** Client for API-key authenticated Admin API endpoints. */
export interface AdminClient {
  /** Get credit usage for the current billing period for a project tied to the API key. */
  getProjectUsage(projectId: string): Promise<ProjectUsage>;
}

export const makeAdminClient = (
  apiKey: string,
  userAgent?: string
): AdminClient => ({
  getProjectUsage: async (projectId) =>
    (await import("./getProjectUsage.js")).getProjectUsage(
      apiKey,
      projectId,
      userAgent
    ),
});
