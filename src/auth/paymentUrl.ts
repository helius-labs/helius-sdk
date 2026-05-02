import { PAYMENT_HOST } from "./constants";

const ENV_VAR = "HELIUS_PAYMENT_HOST";

const readEnvHost = (): string | undefined => {
  if (typeof process === "undefined") return undefined;
  const env = process.env;
  if (!env) return undefined;
  const value = env[ENV_VAR];
  return value && value.length > 0 ? value : undefined;
};

/**
 * Resolves the host that serves the public hosted-checkout page.
 *
 * Order: explicit override > `HELIUS_PAYMENT_HOST` env var > {@link PAYMENT_HOST}.
 * The env-var lookup is guarded so the SDK is safe to import in browsers and Deno
 * where `process` may be undefined.
 */
export const resolvePaymentHost = (override?: string): string => {
  if (override && override.length > 0) return stripTrailingSlash(override);
  const envHost = readEnvHost();
  if (envHost) return stripTrailingSlash(envHost);
  return PAYMENT_HOST;
};

/**
 * Builds the user-clickable payment URL for a given payment intent.
 *
 * @example
 * buildPaymentUrl("pi_abc123") // "https://dashboard.helius.dev/pay/pi_abc123"
 */
export const buildPaymentUrl = (
  paymentIntentId: string,
  hostOverride?: string
): string => `${resolvePaymentHost(hostOverride)}/pay/${paymentIntentId}`;

const stripTrailingSlash = (s: string): string =>
  s.endsWith("/") ? s.slice(0, -1) : s;
