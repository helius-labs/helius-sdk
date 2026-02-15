import type { Project } from "./types";
import { authRequest } from "./utils";

export async function createProject(
  jwt: string,
  userAgent?: string
): Promise<Project> {
  return authRequest<Project>(
    "/projects/create",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({}),
    },
    userAgent
  );
}
