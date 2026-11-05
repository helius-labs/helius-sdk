import type { ApiKey } from "./types.js";
import { authRequest } from "./utils.js";

export async function createApiKey(
  jwt: string,
  projectId: string,
  walletAddress: string,
  userAgent?: string
): Promise<ApiKey> {
  return authRequest<ApiKey>(
    `/projects/${projectId}/add-key`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ userId: walletAddress }),
    },
    userAgent
  );
}
