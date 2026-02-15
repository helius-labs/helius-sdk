import type { AuthClient } from "./types";
import { generateKeypair } from "./generateKeypair";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { createProject } from "./createProject";
import { getProject } from "./getProject";
import { createApiKey } from "./createApiKey";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payUSDC } from "./payUSDC";
import { agenticSignup } from "./agenticSignup";

export function makeAuthClient(userAgent?: string): AuthClient {
  return {
    generateKeypair,
    loadKeypair,
    getAddress,
    signAuthMessage,
    walletSignup: (msg, sig, address) =>
      walletSignup(msg, sig, address, userAgent),
    listProjects: (jwt) => listProjects(jwt, userAgent),
    createProject: (jwt) => createProject(jwt, userAgent),
    getProject: (jwt, id) => getProject(jwt, id, userAgent),
    createApiKey: (jwt, projectId, wallet) =>
      createApiKey(jwt, projectId, wallet, userAgent),
    checkSolBalance,
    checkUsdcBalance,
    payUSDC,
    agenticSignup: (options) => agenticSignup({ ...options, userAgent }),
  };
}
