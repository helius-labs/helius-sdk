import type { AdminClient } from "./client";
import type { ProjectUsage } from "./types";
import { getProjectUsage } from "./getProjectUsage";

export type { AdminClient };

export const makeAdminClientEager = (
  apiKey: string,
  userAgent?: string
): AdminClient => ({
  getProjectUsage: (projectId: string): Promise<ProjectUsage> =>
    getProjectUsage(apiKey, projectId, userAgent),
});
