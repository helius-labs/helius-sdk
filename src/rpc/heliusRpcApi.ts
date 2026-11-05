import type { Rpc, SolanaRpcApi } from "@solana/kit";
import { AutoSent } from "./wrapAutoSend.js";

// Concrete type: Matches createSolanaRpcApi(DEFAULT_RPC_CONFIG) → Rpc → AutoSent (unwrapped Promises)
export type ResolvedHeliusRpcApi = AutoSent<Rpc<SolanaRpcApi>>;
