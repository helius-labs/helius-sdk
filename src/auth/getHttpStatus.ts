/**
 * Extract the HTTP status code from an SDK API error.
 * Prefers a structured `status` property (set by `authRequest`'s JSON-error
 * branch); otherwise parses the `"API error (NNN)"` message pattern.
 * Returns `undefined` when neither is present.
 */
export const getHttpStatus = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined;
  // Errors thrown from authRequest's JSON-error branch carry a structured
  // `status`; prefer it over re-parsing the message.
  const status = (error as Error & { status?: number }).status;
  if (typeof status === "number") return status;
  const match = error.message.match(/API error \((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
};
