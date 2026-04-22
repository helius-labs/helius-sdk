import type { AuthClient } from "./types";
import { generateKeypair } from "./generateKeypair";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { createProject } from "./createProject";
import { getProject } from "./getProject";
import { createApiKey } from "./createApiKey";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payUSDC } from "./payUSDC";
import { payWithMemo } from "./payWithMemo";
import {
  initializeCheckout,
  executeCheckout,
  getCheckoutPreview,
  getPaymentIntent,
  getPaymentStatus,
  payPaymentIntent,
  executeUpgrade,
  executeRenewal,
} from "./checkout";
import { getSignupQuote, initializeSignupFunding } from "./signupFunding";
import { agenticSignup } from "./agenticSignup";
import { purchaseCredits } from "./purchaseCredits";

export function makeAuthClient(userAgent?: string): AuthClient {
  return {
    generateKeypair,
    loadKeypair,
    getAddress,
    signAuthMessage,
    walletSignup: (msg, sig, address) =>
      walletSignup(msg, sig, address, userAgent),
    listProjects: (jwt) => listProjects(jwt, userAgent),
    createProject: (jwt) => createProject(jwt, userAgent),
    getProject: (jwt, id) => getProject(jwt, id, userAgent),
    createApiKey: (jwt, projectId, wallet) =>
      createApiKey(jwt, projectId, wallet, userAgent),
    checkSolBalance,
    checkUsdcBalance,
    payUSDC,
    initializeCheckout: (jwt, req) => initializeCheckout(jwt, req, userAgent),
    executeCheckout: (sk, jwt, req) => executeCheckout(sk, jwt, req, userAgent),
    payWithMemo,
    agenticSignup: (options) => agenticSignup({ ...options, userAgent }),
    getCheckoutPreview: (jwt, plan, period, refId, coupon) =>
      getCheckoutPreview(jwt, plan, period, refId, coupon, userAgent),
    getPaymentIntent: (jwt, id) => getPaymentIntent(jwt, id, userAgent),
    getPaymentStatus: (jwt, id) => getPaymentStatus(jwt, id, userAgent),
    payPaymentIntent: (sk, intent, jwt) =>
      payPaymentIntent(sk, intent, jwt, userAgent),
    getSignupQuote: (jwt, options) => getSignupQuote(jwt, options, userAgent),
    initializeSignupFunding: (jwt, options) =>
      initializeSignupFunding(jwt, options, userAgent),
    executeUpgrade: (
      sk,
      jwt,
      plan,
      period,
      projectId,
      coupon,
      _ua,
      customerInfo
    ) =>
      executeUpgrade(
        sk,
        jwt,
        plan,
        period,
        projectId,
        coupon,
        userAgent,
        customerInfo
      ),
    executeRenewal: (sk, jwt, id) => executeRenewal(sk, jwt, id, userAgent),
    purchaseCredits: (sk, jwt, options) =>
      purchaseCredits(sk, jwt, options, userAgent),
  };
}
