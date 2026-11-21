import {
  PROJECT_POLL_INTERVAL_MS,
  PROJECT_POLL_TIMEOUT_MS,
} from "./constants.js";
import { listProjects } from "./listProjects.js";
import { getProject } from "./getProject.js";
import { existingApiKey } from "./signupHelpers.js";
import { payPaymentLink } from "./payPaymentLink.js";
import { pollUntilTerminal } from "./pollPayment.js";
import { signup } from "./signup.js";
import { sleep } from "./utils.js";
import type {
  SecretKeySignupOptions,
  SignupAndPayOptions,
  SignupAndPayResult,
} from "./types.js";

/**
 * Waits for the payment webhook to provision the project, then returns its
 * first existing API key (or `null`). Never creates a key.
 */
const waitForProject = async (
  jwt: string
): Promise<{ projectId: string } & ReturnType<typeof existingApiKey>> => {
  const deadline = Date.now() + PROJECT_POLL_TIMEOUT_MS;
  let projectId: string | undefined;
  while (Date.now() < deadline) {
    const projects = await listProjects(jwt);
    if (projects.length > 0) {
      projectId = projects[0].id;
      break;
    }
    await sleep(PROJECT_POLL_INTERVAL_MS);
  }
  if (!projectId) {
    throw new Error(
      "Payment confirmed but no project was provisioned within timeout."
    );
  }
  const details = await getProject(jwt, projectId);
  return { projectId, ...existingApiKey(details) };
};

/**
 * `signup` + auto-pay. For `payment_required`, sends USDC + memo from the
 * local keypair, polls authenticated `getPaymentStatus` until either:
 *
 * - `readyToRedirect: true` → waits for the project, returns `kind: "completed"`
 *   with its first existing API key. Never creates a key: `apiKey` and
 *   `endpoints` are `null` when the project has none (call `createApiKey`).
 * - terminal `expired` / `failed` → returns the matching kind
 * - poll timeout → returns `kind: "pending"` with `paymentLink` + `txSignature`
 *
 * `already_subscribed` and `upgrade_required` short-circuit without any payment.
 */
export const signupAndPay = async (
  options: SignupAndPayOptions
): Promise<SignupAndPayResult> => {
  const result = await signup(options);

  if (
    result.kind === "already_subscribed" ||
    result.kind === "upgrade_required"
  ) {
    return result;
  }

  const { jwt, refId, walletAddress, paymentLink } = result;
  const secretKey = (options as SecretKeySignupOptions).secretKey;
  const { txSignature } = await payPaymentLink(secretKey, paymentLink);

  const outcome = await pollUntilTerminal(jwt, paymentLink.paymentIntentId);
  const paymentIntentId = paymentLink.paymentIntentId;

  if (outcome.kind === "completed") {
    const { projectId, apiKey, endpoints } = await waitForProject(jwt);
    return {
      kind: "completed",
      jwt,
      refId,
      walletAddress,
      projectId,
      apiKey,
      endpoints,
      txSignature,
      paymentIntentId,
    };
  }
  if (outcome.kind === "expired") {
    return { kind: "expired", jwt, refId, walletAddress, paymentIntentId };
  }
  if (outcome.kind === "failed") {
    return {
      kind: "failed",
      jwt,
      refId,
      walletAddress,
      paymentIntentId,
      reason: outcome.status.message,
    };
  }

  return {
    kind: "pending",
    jwt,
    refId,
    walletAddress,
    paymentLink,
    txSignature,
  };
};
