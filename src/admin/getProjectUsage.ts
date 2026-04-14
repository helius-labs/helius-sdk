import type { ProjectUsage } from "./types";
import { adminRequest } from "./utils";

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
