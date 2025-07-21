import type { SolanaRpcApi } from "@solana/kit";

import type { GetAssetApi } from "./methods";

export type HeliusCustomApi = GetAssetApi;

export type HeliusRpcApi = SolanaRpcApi & HeliusCustomApi;