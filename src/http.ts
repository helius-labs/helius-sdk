import { version } from "./version";

const getEnvironment = (): "web" | "server" =>
  typeof window !== "undefined" ? "web" : "server";

export const SDK_USER_AGENT = `helius-node-sdk/${version} (${getEnvironment()})`;

export const getUserAgent = (prefix?: string): string =>
  prefix ? `${prefix} ${SDK_USER_AGENT}` : SDK_USER_AGENT;

export const getSDKHeaders = (prefix?: string): Record<string, string> => ({
  "User-Agent": getUserAgent(prefix),
});
