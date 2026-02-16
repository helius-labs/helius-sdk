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

export type PaymentType = "subscription" | "upgrade" | "renewal" | "prepaid_credits" | "overages";
export type PaymentIntentStatus = "pending" | "completed" | "expired" | "failed";

export interface CheckoutInitializeRequest {
  paymentType: PaymentType;
  plan?: string;
  creditAmount?: number;
  projectId?: string;
}

export interface CheckoutInitializeResponse {
  paymentIntentId: string;
  treasuryWallet: string;
  amount: number;
  memo: string;
  solanaPayUrl: string;
  expiresAt: string;
}

export interface CheckoutStatusResponse {
  paymentIntentId: string;
  status: PaymentIntentStatus;
  txSignature?: string;
  payerWallet?: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
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
  initializeCheckout(jwt: string, request: CheckoutInitializeRequest): Promise<CheckoutInitializeResponse>;
  executeCheckout(secretKey: Uint8Array, jwt: string, request: CheckoutInitializeRequest): Promise<CheckoutResult>;
  payWithMemo(secretKey: Uint8Array, treasury: string, amount: bigint, memo: string): Promise<string>;
  agenticSignup(options: AgenticSignupOptions): Promise<AgenticSignupResult>;
}
