import type { ProjectDetails } from "./types";
import { authRequest } from "./utils";

export async function getProject(
  jwt: string,
  id: string,
  userAgent?: string
): Promise<ProjectDetails> {
  return authRequest<ProjectDetails>(
    `/projects/${id}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent
  );
}
