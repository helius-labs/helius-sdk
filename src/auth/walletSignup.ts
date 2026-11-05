import type { SignupResponse } from "./types.js";
import { authRequest } from "./utils.js";

export async function walletSignup(
  message: string,
  signature: string,
  address: string,
  userAgent?: string
): Promise<SignupResponse> {
  return authRequest<SignupResponse>(
    "/wallet-signup",
    {
      method: "POST",
      body: JSON.stringify({ message, signature, userID: address }),
    },
    userAgent
  );
}
