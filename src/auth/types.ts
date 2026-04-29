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

/** Internal — SDK always sets "sponsored" for new signups. "self_funded" kept for backend compat (upgrades, renewals). */
export type PaymentMode = "self_funded" | "sponsored";

export interface CheckoutRequest {
  plan: string; // 'developer' | 'business' | 'professional' | 'agent'
  /**
   * Ignored for `plan: 'agent'` — the Agent Plan is a one-time invoice,
   * not a subscription, so period is not meaningful. Callers may still
   * pass any value for type compatibility; it's dropped before the
   * backend call.
   */
  period: "monthly" | "yearly";
  refId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  couponCode?: string;
  paymentMode?: PaymentMode;
}

export interface CheckoutInitializeRequest {
  priceId: string; // Stripe price ID — resolved internally from plan+period
  refId: string; // User ID (base58 from walletSignup) or project UUID
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  couponCode?: string;
  paymentMode?: PaymentMode;
  signupWalletAddress?: string;
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

export interface CheckoutResult {
  paymentIntentId: string;
  txSignature: string | null;
  status: "completed" | "expired" | "failed" | "timeout";
  projectId?: string;
  apiKey?: string;
  error?: string;
}

export interface AgenticSignupOptions {
  secretKey: Uint8Array;
  userAgent?: string;
  /** 'developer' | 'business' | 'professional' | 'agent' (default). */
  plan?: string;
  /**
   * Only for subscription plans (developer/business/professional).
   * Ignored for `plan: 'agent'` — the Agent Plan is a one-time invoice.
   * Default 'monthly'.
   */
  period?: "monthly" | "yearly";
  /** Required for paid plans (developer/business/professional/agent). */
  email?: string;
  /** Required for paid plans (developer/business/professional/agent). */
  firstName?: string;
  /** Required for paid plans (developer/business/professional/agent). */
  lastName?: string;
  /** Optional coupon code for paid plans (developer/business/professional/agent). */
  couponCode?: string;
  /**
   * Pre-authenticated JWT from `walletSignup`. If provided, `refId` is
   * required. Skips the internal re-authentication round trip so callers
   * that have already invoked `walletSignup` (e.g. to fetch a pricing
   * quote) don't force the user to sign the auth message twice.
   */
  jwt?: string;
  /**
   * `refId` returned by `walletSignup` alongside the JWT. Required when
   * `jwt` is provided.
   */
  refId?: string;
}

export interface AgenticSignupResult {
  status: "success" | "upgraded";
  jwt: string;
  walletAddress: string;
  projectId: string;
  apiKey: string | null;
  endpoints: { mainnet: string; devnet: string } | null;
  credits: number | null;
  txSignature?: string;
}

export interface SignupQuote {
  plan: string;
  /**
   * Echoes the `period` value the caller passed to `getSignupQuote`. Not
   * meaningful for `plan: 'agent'` (one-time invoice, no period) — the
   * value is whatever the caller supplied.
   */
  period: "monthly" | "yearly";
  baseAmountCents: number;
  discountCents: number;
  creditsCents: number;
  dueTodayCents: number;
  destinationWallet: string;
  note: string;
  coupon?: CheckoutPreviewCoupon | null;
}

export interface SignupFundingIntent {
  paymentIntentId: string;
  amountCents: number;
  destinationWallet: string;
  solanaPayUrl: string;
  expiresAt: string;
}

export interface BuildSponsoredTxResponse {
  transaction: string;
  paymentIntentId: string;
  lastValidBlockHeight: number;
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

export interface PurchaseCreditsOptions {
  /** Tier key from `stripe.prepaidCreditsPlans` — default `"10_USDC"`. */
  tier?: PrepaidCreditsTier;
  /** Quantity multiplier. Each unit grants 1,000,000 credits. Default 1. */
  qty?: number;
  /** Project receiving the credits. */
  projectId: string;
  /** Optional coupon code applied to the checkout. */
  couponCode?: string;
}

export interface PurchaseCreditsResult {
  paymentIntentId: string;
  txSignature: string | null;
  status: "completed" | "expired" | "failed" | "timeout";
  amountCents: number;
  error?: string;
}

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
  executeCheckout(
    secretKey: Uint8Array,
    jwt: string,
    request: CheckoutRequest
  ): Promise<CheckoutResult>;
  payWithMemo(
    secretKey: Uint8Array,
    treasury: string,
    amount: bigint,
    memo: string
  ): Promise<string>;
  agenticSignup(options: AgenticSignupOptions): Promise<AgenticSignupResult>;
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
  payPaymentIntent(
    secretKey: Uint8Array,
    intent: CheckoutInitializeResponse,
    jwt?: string
  ): Promise<string>;
  getSignupQuote(
    jwt: string,
    options: {
      plan: string;
      period: "monthly" | "yearly";
      refId: string;
      couponCode?: string;
    }
  ): Promise<SignupQuote>;
  initializeSignupFunding(
    jwt: string,
    options: {
      plan: string;
      period: "monthly" | "yearly";
      refId: string;
      walletAddress?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      couponCode?: string;
    }
  ): Promise<SignupFundingIntent>;
  executeUpgrade(
    secretKey: Uint8Array,
    jwt: string,
    plan: string,
    period: "monthly" | "yearly",
    projectId: string,
    couponCode?: string,
    userAgent?: string,
    customerInfo?: { email?: string; firstName?: string; lastName?: string }
  ): Promise<CheckoutResult>;
  executeRenewal(
    secretKey: Uint8Array,
    jwt: string,
    paymentIntentId: string
  ): Promise<CheckoutResult>;
  /**
   * Buy additional prepaid credits for an agent-plan project. Agent-only
   * in this release: pre-flight rejects non-agent projects before
   * calling `/checkout/initialize` (see `src/auth/purchaseCredits.ts`).
   */
  purchaseCredits(
    secretKey: Uint8Array,
    jwt: string,
    options: PurchaseCreditsOptions
  ): Promise<PurchaseCreditsResult>;
}
