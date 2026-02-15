import type { ProjectListItem } from "./types";
import { authRequest } from "./utils";

export async function listProjects(
  jwt: string,
  userAgent?: string,
): Promise<ProjectListItem[]> {
  return authRequest<ProjectListItem[]>(
    "/projects",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent,
  );
}
