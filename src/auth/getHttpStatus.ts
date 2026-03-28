/**
 * Extract the HTTP status code from an SDK API error message.
 * Returns `undefined` if the error does not match the `"API error (NNN)"` pattern.
 */
export const getHttpStatus = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined;
  const match = error.message.match(/API error \((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
};
