import type { ProjectUsage } from "./types.js";
import { adminRequest } from "./utils.js";

export async function getProjectUsage(
  apiKey: string,
  projectId: string,
  userAgent?: string
): Promise<ProjectUsage> {
  return adminRequest<ProjectUsage>(
    apiKey,
    `/admin/projects/${encodeURIComponent(projectId)}/usage`,
    {
      method: "GET",
    },
    userAgent
  );
}
