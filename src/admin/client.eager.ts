import type { AdminClient } from "./client.js";
import type { ProjectUsage } from "./types.js";
import { getProjectUsage } from "./getProjectUsage.js";

export type { AdminClient };

export const makeAdminClientEager = (
  apiKey: string,
  userAgent?: string
): AdminClient => ({
  getProjectUsage: (projectId: string): Promise<ProjectUsage> =>
    getProjectUsage(apiKey, projectId, userAgent),
});
