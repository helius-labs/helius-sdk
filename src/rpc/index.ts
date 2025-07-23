import { createDefaultRpcTransport, createRpc, createSolanaRpcApi, DEFAULT_RPC_CONFIG } from '@solana/kit';
import { wrapAutoSend } from "./wrapAutoSend";
import { customApiWrapper } from './customApiWrapper';
import { ResolvedHeliusRpcApi } from './heliusRpcApi';


interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet";
    autoSend?: boolean;
}

export const createHelius = ({ apiKey, network = "mainnet", autoSend = true }: HeliusRpcOptions) => {
    const baseUrl = `https://${network}.helius-rpc.com/`;
    const url = `${baseUrl}?api-key=${apiKey}`;

    const baseApi = createSolanaRpcApi(DEFAULT_RPC_CONFIG);
    const customApi = customApiWrapper(baseApi);
    const transport = createDefaultRpcTransport({
        url
    });

    let rpc = createRpc({ api: customApi, transport });
    if (autoSend) {
        rpc = wrapAutoSend(rpc);
    }

    return rpc as unknown as ResolvedHeliusRpcApi;
};