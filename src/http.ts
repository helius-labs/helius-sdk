import { version } from "./version";

const getEnvironment = (): "web" | "server" =>
  typeof window !== "undefined" ? "web" : "server";

export const SDK_USER_AGENT = `helius-node-sdk/${version} (${getEnvironment()})`;

export const getSDKHeaders = (): Record<string, string> => ({
  "User-Agent": SDK_USER_AGENT,
});
