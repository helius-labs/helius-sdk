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
  getCheckoutPreview,
  getPaymentIntent,
} from "./checkout";
import { getPaymentStatus } from "./getPaymentStatus";
import { purchaseCredits, purchaseCreditsAndPay } from "./purchaseCredits";
import { upgradePlan, upgradePlanAndPay } from "./upgradePlan";
import { payRenewal, payRenewalAndPay } from "./payRenewal";
import { signup } from "./signup";
import { signupAndPay } from "./signupAndPay";
import { payPaymentLink } from "./payPaymentLink";
import { createPayment } from "./createPayment";

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
    payWithMemo,
    getCheckoutPreview: (jwt, plan, period, refId, coupon) =>
      getCheckoutPreview(jwt, plan, period, refId, coupon, userAgent),
    getPaymentIntent: (jwt, id) => getPaymentIntent(jwt, id, userAgent),
    getPaymentStatus: (jwt, id) => getPaymentStatus(jwt, id, userAgent),
    purchaseCredits,
    purchaseCreditsAndPay,
    upgradePlan,
    upgradePlanAndPay,
    payRenewal,
    payRenewalAndPay,
    createPayment,
    signup,
    signupAndPay,
    payPaymentLink,
  };
}
