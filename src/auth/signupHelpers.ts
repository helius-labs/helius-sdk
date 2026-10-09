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
