export function buildEndpoints(apiKey: string) {
  return {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };
}

/**
 * Trims a contact field. Returns `undefined` for non-strings and for strings
 * that are empty after trimming, so callers can treat both as "not provided".
 */
export function normalizeContactField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
