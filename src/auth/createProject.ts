import type { Project } from "./types.js";
import { authRequest } from "./utils.js";

/**
 * @deprecated Wallet-created projects are no longer supported by the backend. Use `signup` / `signupAndPay` (requires `email`, `firstName`, `lastName`).
 */
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
