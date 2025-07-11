import type { SolanaRpcApi } from "@solana/kit";

import type { GetAssetApi } from "../methods";

export type HeliusRpcApi = SolanaRpcApi & GetAssetApi;