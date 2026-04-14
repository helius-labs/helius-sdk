export interface AdminBillingCycle {
  start: string;
  end: string;
}

export interface AdminUsageBreakdown {
  api: number;
  archival: number;
  das: number;
  grpc: number;
  grpcGeyser: number;
  photon: number;
  rpc: number;
  stream: number;
  webhook: number;
  websocket: number;
}

export interface AdminSubscriptionDetails {
  billingCycle: AdminBillingCycle;
  creditsLimit: number;
  plan: string;
}

export interface ProjectUsage {
  creditsRemaining: number;
  creditsUsed: number;
  prepaidCreditsRemaining: number;
  prepaidCreditsUsed: number;
  subscriptionDetails: AdminSubscriptionDetails;
  usage: AdminUsageBreakdown;
}
