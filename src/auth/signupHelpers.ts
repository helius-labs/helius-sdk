import type { Endpoints, ProjectDetails } from "./types.js";

export function buildEndpoints(apiKey: string): Endpoints {
  return {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };
}

/**
 * The project's first existing API key and its endpoints, or `null` for both
 * when the project has no keys. Never creates a key.
 */
export function existingApiKey(details: Pick<ProjectDetails, "apiKeys">): {
  apiKey: string | null;
  endpoints: Endpoints | null;
} {
  const apiKey = details.apiKeys?.[0]?.keyId || null;
  return { apiKey, endpoints: apiKey ? buildEndpoints(apiKey) : null };
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

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactInfo {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Normalizes `email`, `firstName` and `lastName` and requires all three.
 * Throws `"<context> requires contact info. Missing: ..."` when any is absent
 * (after trimming) and `"Invalid email address."` for a malformed email.
 */
export function requireContactInfo(
  fields: { email?: unknown; firstName?: unknown; lastName?: unknown },
  context: string
): ContactInfo {
  const email = normalizeContactField(fields.email);
  const firstName = normalizeContactField(fields.firstName);
  const lastName = normalizeContactField(fields.lastName);
  if (!email || !firstName || !lastName) {
    const missing = [
      !email && "email",
      !firstName && "firstName",
      !lastName && "lastName",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`${context} requires contact info. Missing: ${missing}.`);
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Invalid email address.");
  }
  return { email, firstName, lastName };
}
