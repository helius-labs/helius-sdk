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
}

export interface Project extends ProjectListItem {
  apiKeys?: ApiKey[];
  creditsUsage?: CreditsUsage;
  billingCycle?: BillingCycle;
  subscriptionPlanDetails?: SubscriptionPlanDetails;
  prepaidCreditsLink?: string;
}

export type PaymentIntentStatus =
  | "pending"
  | "completed"
  | "expired"
  | "failed";

export type CheckoutPhase = "confirming" | "activating" | "complete" | "failed" | "expired";

export interface CheckoutRequest {
  plan: string;                // 'developer' | 'business' | 'professional'
  period: "monthly" | "yearly";
  refId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  couponCode?: string;
}

export interface CheckoutInitializeRequest {
  priceId: string;           // OpenPay price ID — resolved internally from plan+period
  refId: string;             // User ID (base58 from walletSignup) or project UUID
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  couponCode?: string;
}

export interface CheckoutInitializeResponse {
  id: string;                        // Payment intent ID — also used as memo
  status: PaymentIntentStatus;
  amount: number;                    // Amount in CENTS (4900 = $49.00)
  destinationWallet: string;         // Merchant USDC wallet
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
  amountOff?: number;        // cents
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
  baseAmount: number;          // cents
  subtotal: number;            // cents
  appliedCredits: number;      // cents
  proratedCredits: number;     // cents
  discounts: number;           // cents
  dueToday: number;            // cents — final amount after credits/discounts
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
  plan?: string;                  // Override default 'developer'
  period?: "monthly" | "yearly";  // Override default 'monthly'
  email?: string;
}

export interface AgenticSignupResult {
  status: "success" | "existing_project";
  jwt: string;
  walletAddress: string;
  projectId: string;
  apiKey: string | null;
  endpoints: { mainnet: string; devnet: string } | null;
  credits: number | null;
  txSignature?: string;
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
  getCheckoutPreview(jwt: string, plan: string, period: "monthly" | "yearly", refId: string, couponCode?: string): Promise<CheckoutPreviewResponse>;
  getPaymentIntent(jwt: string, paymentIntentId: string): Promise<CheckoutInitializeResponse>;
  getPaymentStatus(jwt: string, paymentIntentId: string): Promise<CheckoutStatusResponse>;
  payPaymentIntent(secretKey: Uint8Array, intent: CheckoutInitializeResponse): Promise<string>;
  executeUpgrade(secretKey: Uint8Array, jwt: string, plan: string, period: "monthly" | "yearly", projectId: string, couponCode?: string): Promise<CheckoutResult>;
  executeRenewal(secretKey: Uint8Array, jwt: string, paymentIntentId: string): Promise<CheckoutResult>;
}
