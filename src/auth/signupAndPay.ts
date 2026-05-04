import { PROJECT_POLL_INTERVAL_MS, PROJECT_POLL_TIMEOUT_MS } from "./constants";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { createApiKey } from "./createApiKey";
import { buildEndpoints } from "./signupHelpers";
import { payPaymentLink } from "./payPaymentLink";
import { pollUntilTerminal } from "./pollPayment";
import { signup } from "./signup";
import { sleep } from "./utils";
import type {
  Endpoints,
  SecretKeySignupOptions,
  SignupAndPayOptions,
  SignupAndPayResult,
} from "./types";

const provisionApiKey = async (
  jwt: string,
  walletAddress: string
): Promise<{ projectId: string; apiKey: string; endpoints: Endpoints }> => {
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
  let apiKey = details.apiKeys?.[0]?.keyId;
  if (!apiKey) {
    apiKey = (await createApiKey(jwt, projectId, walletAddress)).keyId;
  }
  return {
    projectId,
    apiKey,
    endpoints: buildEndpoints(apiKey) as Endpoints,
  };
};

/**
 * `signup` + auto-pay. For `payment_required`, sends USDC + memo from the
 * local keypair, polls authenticated `getPaymentStatus` until either:
 *
 * - `readyToRedirect: true` → provisions API key, returns `kind: "completed"`
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
    const { projectId, apiKey, endpoints } = await provisionApiKey(
      jwt,
      walletAddress
    );
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
