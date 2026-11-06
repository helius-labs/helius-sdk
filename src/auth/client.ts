import type { AuthClient } from "./types.js";
import { generateKeypair } from "./generateKeypair.js";
import { loadKeypair } from "./loadKeypair.js";
import { getAddress } from "./getAddress.js";
import { signAuthMessage } from "./signAuthMessage.js";
import { walletSignup } from "./walletSignup.js";
import { listProjects } from "./listProjects.js";
import { createProject } from "./createProject.js";
import { getProject } from "./getProject.js";
import { createApiKey } from "./createApiKey.js";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances.js";
import { payUSDC } from "./payUSDC.js";
import { payWithMemo } from "./payWithMemo.js";
import {
  initializeCheckout,
  getCheckoutPreview,
  getPaymentIntent,
} from "./checkout.js";
import { getPaymentStatus } from "./getPaymentStatus.js";
import { purchaseCredits, purchaseCreditsAndPay } from "./purchaseCredits.js";
import { upgradePlan, upgradePlanAndPay } from "./upgradePlan.js";
import { payRenewal, payRenewalAndPay } from "./payRenewal.js";
import { signup } from "./signup.js";
import { signupAndPay } from "./signupAndPay.js";
import { payPaymentLink } from "./payPaymentLink.js";
import { createPayment } from "./createPayment.js";

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
