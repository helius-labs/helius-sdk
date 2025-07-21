import { createDefaultRpcTransport, createRpc, createSolanaRpcApi, DEFAULT_RPC_CONFIG } from "@solana/kit";
import { wrapAutoSend } from "./wrapAutoSend";

import type { HeliusRpcApi } from "./heliusRpcApi";
import type { Rpc } from "@solana/kit";
import { customApiWrapper } from "./customApiWrapper";


interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet",
    autoSend?: boolean;
}

export const createHeliusRpcFull = ({ apiKey, network = "mainnet", autoSend = true }: HeliusRpcOptions) => {
    const baseUrl = `https://${network}.helius-rpc.com/`;
    const url = `${baseUrl}?api-key=${apiKey}`;
    
    const baseApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
    const customApi = customApiWrapper(baseApi);

    //const api = createSolanaRpcApi<HeliusRpcApi>(DEFAULT_RPC_CONFIG);
    const transport = createDefaultRpcTransport({
        url
    });

    let rpc = createRpc({ api: customApi, transport });

    if (autoSend) {
        rpc = wrapAutoSend(rpc);
    }

    return rpc as Rpc<HeliusRpcApi>;
};
