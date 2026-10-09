/**
 * Legacy 1 USDC unlock-fee transfer for wallet-created projects.
 *
 * Always throws without sending funds: the backend no longer creates projects
 * for wallet-only sign-ins, so the fee would buy nothing.
 *
 * @deprecated Use `signup` / `signupAndPay` (requires `email`, `firstName`, `lastName`).
 */
export async function payUSDC(_secretKey: Uint8Array): Promise<string> {
  throw new Error(
    "payUSDC is no longer supported: wallet-created projects were removed. Use signup or signupAndPay with email, firstName and lastName."
  );
}
