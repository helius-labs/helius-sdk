export interface WalletKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SignupResponse {
  token: string;
  refId: string;
  newUser: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  cryptoSub: boolean;
  paymentServiceProvider: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DnsRecord {
  id: string;
  dns: string;
  network: string;
  usageType: string;
}

export interface ApiKey {
  keyId: string;
  keyName: string;
  walletId: string;
  projectId: string;
  usagePlan: string;
  createdAt: number;
  prepaidCredits: number;
}

export interface CreditsUsage {
  totalCreditsUsed: number;
  remainingCredits: number;
  remainingPrepaidCredits: number;
  prepaidCreditsUsed: number;
  overageCreditsUsed: number;
  overageCost: number;
  webhookUsage: number;
  apiUsage: number;
  rpcUsage: number;
  rpcGPAUsage: number;
}

export interface BillingCycle {
  start: string;
  end: string;
}

export interface SubscriptionPlanDetails {
  currentPlan: string;
  upcomingPlan: string;
  isUpgrading: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  verifiedEmail: string | null;
  subscription: Subscription;
  users: User[];
  dnsRecords: DnsRecord[];
}

export interface ProjectDetails {
  apiKeys: ApiKey[];
  creditsUsage: CreditsUsage;
  billingCycle: BillingCycle;
  subscriptionPlanDetails: SubscriptionPlanDetails;
  prepaidCreditsLink: string;
  /**
   * Stripe price ID for the project's prepaid-credits top-up SKU.
   * Resolved server-side from the plan's per-credit overage cost
   * (e.g. agent_v4 → 10 USDC → 1M credits price). Only present when the
   * plan exposes prepaid-credits top-ups; absent for FREE / enterprise.
   */
  prepaidCreditsPriceId?: string;
}

export interface Project extends ProjectListItem {
  apiKeys?: ApiKey[];
  creditsUsage?: CreditsUsage;
  billingCycle?: BillingCycle;
  subscriptionPlanDetails?: SubscriptionPlanDetails;
  prepaidCreditsLink?: string;
  prepaidCreditsPriceId?: string;
}

export type PaymentIntentStatus =
  | "pending"
  | "completed"
  | "expired"
  | "failed";

export type CheckoutPhase =
  | "confirming"
  | "activating"
  | "complete"
  | "failed"
  | "expired";

export interface CheckoutInitializeRequest {
  priceId: string; // Stripe price ID — resolved internally from plan+period
  refId: string; // User ID (base58 from walletSignup) or project UUID
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  couponCode?: string;
  /**
   * Quantity multiplier for one-time purchases (prepaid credits). Each
   * unit grants 1,000,000 credits at the backend. Ignored for
   * subscription plans.
   */
  qty?: number;
}

export interface CheckoutInitializeResponse {
  id: string; // Payment intent ID — also used as memo
  status: PaymentIntentStatus;
  amount: number; // Amount in CENTS (4900 = $49.00)
  destinationWallet: string; // Merchant USDC wallet
  solanaPayUrl: string;
  expiresAt: string;
  createdAt: string;
  priceId: string;
  refId: string;
  couponCode?: string;
  originalAmountCents?: number;
  discountAmountCents?: number;
  txSignature?: string;
  payerWallet?: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface CheckoutStatusResponse {
  status: PaymentIntentStatus;
  phase: CheckoutPhase;
  subscriptionActive: boolean;
  readyToRedirect: boolean;
  message: string;
  messageSecondary?: string;
}

export interface CheckoutPreviewCoupon {
  code: string;
  valid: boolean;
  percentOff?: number;
  amountOff?: number; // cents
  description?: string;
  invalidReason?: string;
}

export interface CheckoutPreviewCustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export interface CheckoutPreviewResponse {
  planName: string;
  period: "monthly" | "yearly";
  baseAmount: number; // cents
  subtotal: number; // cents
  appliedCredits: number; // cents
  proratedCredits: number; // cents
  discounts: number; // cents
  dueToday: number; // cents — final amount after credits/discounts
  destinationWallet: string;
  note: string;
  coupon?: CheckoutPreviewCoupon | null;
  customerInfo?: CheckoutPreviewCustomerInfo;
}

/**
 * Known prepaid-credits tier keys the backend exposes today. `10_USDC` is
 * the canonical agent top-up: 10 USDC → 1,000,000 additional credits,
 * matching the agent plan's signup pricing and `overageCost`. The backend
 * also exposes `4_USDC` and `5_USDC` tiers but only `10_USDC` is
 * advertised by the CLI/MCP. The `string & {}` opening keeps the type
 * future-proof for tiers added later without an SDK patch.
 */
export type PrepaidCreditsTier = "10_USDC" | (string & {});

export interface AuthClient {
  generateKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
  loadKeypair(bytes: Uint8Array): WalletKeypair;
  getAddress(keypair: WalletKeypair): Promise<string>;
  signAuthMessage(secretKey: Uint8Array): Promise<{
    message: string;
    signature: string;
  }>;
  walletSignup(
    msg: string,
    sig: string,
    address: string
  ): Promise<SignupResponse>;
  listProjects(jwt: string): Promise<ProjectListItem[]>;
  createProject(jwt: string): Promise<Project>;
  getProject(jwt: string, id: string): Promise<ProjectDetails>;
  createApiKey(jwt: string, projectId: string, wallet: string): Promise<ApiKey>;
  checkSolBalance(address: string): Promise<bigint>;
  checkUsdcBalance(address: string): Promise<bigint>;
  payUSDC(secretKey: Uint8Array): Promise<string>;
  initializeCheckout(
    jwt: string,
    request: CheckoutInitializeRequest
  ): Promise<CheckoutInitializeResponse>;
  payWithMemo(
    secretKey: Uint8Array,
    treasury: string,
    amount: bigint,
    memo: string
  ): Promise<string>;
  getCheckoutPreview(
    jwt: string,
    plan: string,
    period: "monthly" | "yearly",
    refId: string,
    couponCode?: string
  ): Promise<CheckoutPreviewResponse>;
  getPaymentIntent(
    jwt: string,
    paymentIntentId: string
  ): Promise<CheckoutInitializeResponse>;
  getPaymentStatus(
    jwt: string,
    paymentIntentId: string
  ): Promise<CheckoutStatusResponse>;
  /**
   * Phase 2 — buy additional prepaid credits for an agent-plan project.
   * Agent-only in this release: pre-flight rejects non-agent projects.
   * Returns a hosted-checkout `PaymentLink`; for autopay use
   * {@link AuthClient.purchaseCreditsAndPay}.
   */
  purchaseCredits(
    options: PurchaseCreditsLinkOptions
  ): Promise<PurchaseCreditsLinkResult>;
  /** Same as {@link AuthClient.purchaseCredits}, plus auto-pay + activation polling. */
  purchaseCreditsAndPay(
    options: PurchaseCreditsAndPayOptions
  ): Promise<PurchaseCreditsAndPayResult>;
  /**
   * Phase 2 — upgrade an existing project to a new plan. Returns a
   * hosted-checkout `PaymentLink`; for autopay use
   * {@link AuthClient.upgradePlanAndPay}.
   */
  upgradePlan(options: UpgradePlanOptions): Promise<UpgradePlanResult>;
  /** Same as {@link AuthClient.upgradePlan}, plus auto-pay + activation polling. */
  upgradePlanAndPay(
    options: UpgradePlanAndPayOptions
  ): Promise<UpgradePlanAndPayResult>;
  /**
   * Phase 2 — wrap an existing renewal payment intent as a `PaymentLink`.
   * The intent must already exist (created by the billing handler when a
   * subscription renews). Use {@link AuthClient.payRenewalAndPay} to
   * auto-pay from a local keypair.
   */
  payRenewal(jwt: string, paymentIntentId: string): Promise<PayRenewalResult>;
  payRenewalAndPay(
    secretKey: Uint8Array,
    jwt: string,
    paymentIntentId: string
  ): Promise<PayRenewalAndPayResult>;
  /**
   * Phase 2 — shared primitive that drives every paid flow. Exposed for
   * advanced callers; signup / upgrade / credits / renewal-link wrap it.
   */
  createPayment(
    request: import("./createPayment").CreatePaymentRequest
  ): Promise<PaymentLink>;
  /**
   * Phase 1 unified signup. Authenticates the wallet, detects existing
   * projects, and either short-circuits (`already_subscribed`) or returns
   * a hosted-checkout link (`payment_required`). Different-plan existing
   * projects return `upgrade_required` (use `upgradePlan` in Phase 2).
   *
   * Zero-amount checkouts (e.g. 100% coupons) are rejected up front.
   */
  signup(options: SignupOptions): Promise<SignupResult>;
  /**
   * Same as `signup`, but when a payment is required, sends USDC + memo
   * from the local keypair and polls activation until the project is
   * provisioned. On poll timeout returns `kind: "pending"` with the
   * `txSignature` so callers can resume later.
   */
  signupAndPay(options: SignupAndPayOptions): Promise<SignupAndPayResult>;
  /**
   * Send USDC + memo for a stored {@link PaymentLink}. Wraps {@link payWithMemo}
   * with the cents → raw conversion (USDC has 6 decimals; cents × 10_000 →
   * raw token units) and uses `paymentLink.paymentIntentId` as the memo.
   * Used by the CLI `--pay` resume path; does not poll.
   */
  payPaymentLink(
    secretKey: Uint8Array,
    paymentLink: PaymentLink
  ): Promise<{ txSignature: string }>;
}

// ── Phase 1 unified signup types ─────────────────────────────────────────

/** Wallet-app endpoints handed back after a successful signup. */
export interface Endpoints {
  mainnet: string;
  devnet: string;
}

export type SupportedPlan = "agent" | "developer" | "business" | "professional";

/**
 * Hosted-checkout link returned to the caller. The user clicks
 * `paymentUrl` in a browser, OR an agent sends `amountCents` (× 10_000)
 * USDC raw to `destinationWallet` with `memo` = `paymentIntentId`.
 */
export interface PaymentLink {
  kind: "payment_required";
  paymentIntentId: string;
  amountCents: number;
  destinationWallet: string;
  /** Always equal to `paymentIntentId`. */
  memo: string;
  expiresAt: string;
  /** e.g. `https://dashboard.helius.dev/pay/<paymentIntentId>` */
  paymentUrl: string;
  /** Raw `solana:` URI for wallet apps. */
  solanaPayUrl: string;
  /** Display name resolved from plan/period (e.g. `"Agent Plan"`). */
  planName: string;
}

/** Default `signup()` shape — SDK signs the auth message itself. */
export interface SecretKeySignupOptions {
  secretKey: Uint8Array;
  plan: SupportedPlan;
  /** Ignored for `plan: "agent"`. Defaults to `"monthly"` for paid subscription plans. */
  period?: "monthly" | "yearly";
  email?: string;
  firstName?: string;
  lastName?: string;
  couponCode?: string;
  /** Override the hosted-page host. See {@link resolvePaymentHost}. */
  paymentHost?: string;
}

/**
 * Advanced `signup()` shape — caller already invoked `walletSignup` and
 * carries the resulting JWT, refId, and wallet address. Skips the internal
 * re-authentication round trip.
 */
export interface PreauthenticatedSignupOptions {
  jwt: string;
  refId: string;
  walletAddress: string;
  plan: SupportedPlan;
  period?: "monthly" | "yearly";
  email?: string;
  firstName?: string;
  lastName?: string;
  couponCode?: string;
  paymentHost?: string;
}

export type SignupOptions =
  | SecretKeySignupOptions
  | PreauthenticatedSignupOptions;

/**
 * `signupAndPay()` always needs the keypair to sign the USDC transfer, so
 * even the preauthenticated shape must carry `secretKey`.
 */
export type SignupAndPayOptions =
  | SecretKeySignupOptions
  | (PreauthenticatedSignupOptions & { secretKey: Uint8Array });

export type SignupResult =
  | {
      kind: "payment_required";
      jwt: string;
      refId: string;
      walletAddress: string;
      paymentLink: PaymentLink;
    }
  | {
      kind: "already_subscribed";
      jwt: string;
      refId: string;
      walletAddress: string;
      projectId: string;
      apiKey: string;
      endpoints: Endpoints;
    }
  | {
      kind: "upgrade_required";
      jwt: string;
      refId: string;
      walletAddress: string;
      currentPlan: string;
      requestedPlan: string;
    };

export type SignupAndPayResult =
  | Extract<SignupResult, { kind: "already_subscribed" }>
  | Extract<SignupResult, { kind: "upgrade_required" }>
  | {
      kind: "completed";
      jwt: string;
      refId: string;
      walletAddress: string;
      projectId: string;
      apiKey: string;
      endpoints: Endpoints;
      txSignature?: string;
      paymentIntentId?: string;
    }
  | {
      kind: "pending";
      jwt: string;
      refId: string;
      walletAddress: string;
      paymentLink: PaymentLink;
      txSignature?: string;
    }
  | {
      kind: "expired";
      jwt: string;
      refId: string;
      walletAddress: string;
      paymentIntentId: string;
    }
  | {
      kind: "failed";
      jwt: string;
      refId: string;
      walletAddress: string;
      paymentIntentId: string;
      reason?: string;
    };

// ── Phase 2 — upgrade / credits / renewal-link types ──────────────────────

export interface UpgradePlanOptions {
  jwt: string;
  /** Project UUID being upgraded. */
  projectId: string;
  plan: SupportedPlan;
  period?: "monthly" | "yearly";
  couponCode?: string;
  /**
   * Contact info — optional for upgrades; the backend auto-fetches from the
   * project's existing Stripe customer. Pass them only on the first upgrade
   * for a wallet that doesn't yet have a Stripe customer record.
   */
  email?: string;
  firstName?: string;
  lastName?: string;
  paymentHost?: string;
}

export interface UpgradePlanAndPayOptions extends UpgradePlanOptions {
  secretKey: Uint8Array;
}

export type UpgradePlanResult = {
  kind: "payment_required";
  paymentLink: PaymentLink;
};

export type UpgradePlanAndPayResult =
  | {
      kind: "completed";
      txSignature?: string;
      paymentIntentId: string;
    }
  | {
      kind: "pending";
      paymentLink: PaymentLink;
      txSignature?: string;
    }
  | {
      kind: "expired";
      paymentIntentId: string;
    }
  | {
      kind: "failed";
      paymentIntentId: string;
      reason?: string;
    };

export interface PurchaseCreditsLinkOptions {
  jwt: string;
  /** Project UUID receiving the credits. Must be on `agent_v4` in this release. */
  projectId: string;
  /** Quantity multiplier. Each unit = 1,000,000 credits. Defaults to 1. */
  qty?: number;
  couponCode?: string;
  paymentHost?: string;
}

export interface PurchaseCreditsAndPayOptions
  extends PurchaseCreditsLinkOptions {
  secretKey: Uint8Array;
}

export type PurchaseCreditsLinkResult = {
  kind: "payment_required";
  paymentLink: PaymentLink;
};

/** Same shape as {@link UpgradePlanAndPayResult} — purchase has no project to short-circuit. */
export type PurchaseCreditsAndPayResult = UpgradePlanAndPayResult;

export type PayRenewalResult = {
  kind: "payment_required";
  paymentLink: PaymentLink;
};

export type PayRenewalAndPayResult = UpgradePlanAndPayResult;
