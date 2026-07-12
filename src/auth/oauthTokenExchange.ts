import { authRequest } from "./utils";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: { id: string; email: string };
}

export interface OAuthTokenExchangeArgs {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  userAgent?: string;
}

/**
 * Exchanges an OAuth/PKCE authorization code for a Helius JWT.
 *
 * Used by `helius login` after the browser redirects back to the CLI's loopback
 * server with the auth code. The endpoint is RFC 6749 §4.1.3 compliant
 * (form-encoded body, JSON error envelope on failure).
 *
 * Public OAuth client per RFC 8252 §6 — no `client_secret` is sent or accepted.
 * PKCE binds the auth code to the originating CLI invocation.
 */
export async function oauthTokenExchange(
  args: OAuthTokenExchangeArgs
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    code_verifier: args.codeVerifier,
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
  });
  return authRequest<OAuthTokenResponse>(
    "/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    args.userAgent
  );
}
