import type { AuthClient } from "./types";
import { loadKeypair } from "./loadKeypair";

export function makeAuthClient(userAgent?: string): AuthClient {
  return {
    generateKeypair: async () =>
      (await import("./generateKeypair.js")).generateKeypair(),
    loadKeypair,
    getAddress: async (keypair) =>
      (await import("./getAddress.js")).getAddress(keypair),
    signAuthMessage: async (sk) =>
      (await import("./signAuthMessage.js")).signAuthMessage(sk),
    walletSignup: async (msg, sig, address) =>
      (await import("./walletSignup.js")).walletSignup(
        msg,
        sig,
        address,
        userAgent
      ),
    listProjects: async (jwt) =>
      (await import("./listProjects.js")).listProjects(jwt, userAgent),
    createProject: async (jwt) =>
      (await import("./createProject.js")).createProject(jwt, userAgent),
    getProject: async (jwt, id) =>
      (await import("./getProject.js")).getProject(jwt, id, userAgent),
    createApiKey: async (jwt, projectId, wallet) =>
      (await import("./createApiKey.js")).createApiKey(
        jwt,
        projectId,
        wallet,
        userAgent
      ),
    checkSolBalance: async (address) =>
      (await import("./checkBalances.js")).checkSolBalance(address),
    checkUsdcBalance: async (address) =>
      (await import("./checkBalances.js")).checkUsdcBalance(address),
    payUSDC: async (sk) => (await import("./payUSDC.js")).payUSDC(sk),
    initializeCheckout: async (jwt, req) =>
      (await import("./checkout.js")).initializeCheckout(jwt, req, userAgent),
    executeCheckout: async (sk, jwt, req) =>
      (await import("./checkout.js")).executeCheckout(sk, jwt, req, userAgent),
    payWithMemo: async (sk, treasury, amount, memo) =>
      (await import("./payWithMemo.js")).payWithMemo(
        sk,
        treasury,
        amount,
        memo
      ),
    agenticSignup: async (options) =>
      (await import("./agenticSignup.js")).agenticSignup({
        ...options,
        userAgent,
      }),
    getCheckoutPreview: async (jwt, plan, period, refId, coupon) =>
      (await import("./checkout.js")).getCheckoutPreview(
        jwt,
        plan,
        period,
        refId,
        coupon,
        userAgent
      ),
    getPaymentIntent: async (jwt, id) =>
      (await import("./checkout.js")).getPaymentIntent(jwt, id, userAgent),
    getPaymentStatus: async (jwt, id) =>
      (await import("./checkout.js")).getPaymentStatus(jwt, id, userAgent),
    payPaymentIntent: async (sk, intent) =>
      (await import("./checkout.js")).payPaymentIntent(sk, intent),
    executeUpgrade: async (sk, jwt, plan, period, projectId, coupon) =>
      (await import("./checkout.js")).executeUpgrade(
        sk,
        jwt,
        plan,
        period,
        projectId,
        coupon,
        userAgent
      ),
    executeRenewal: async (sk, jwt, id) =>
      (await import("./checkout.js")).executeRenewal(sk, jwt, id, userAgent),
  };
}
