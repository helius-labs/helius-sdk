import { version } from "./version";

const getEnvironment = (): "web" | "server" =>
  typeof window !== "undefined" ? "web" : "server";

export const SDK_USER_AGENT = `helius-node-sdk/${version} (${getEnvironment()})`;

export const getUserAgent = (prefix?: string): string => {
  if (!prefix) return SDK_USER_AGENT;
  // Sanitize: only allow printable ASCII typically found in User-Agent tokens
  const sanitized = prefix.replace(/[^\x20-\x7E]/g, "").trim();
  if (!sanitized) return SDK_USER_AGENT;
  return `${sanitized} ${SDK_USER_AGENT}`;
};

export const getSDKHeaders = (prefix?: string): Record<string, string> => ({
  "User-Agent": getUserAgent(prefix),
});
