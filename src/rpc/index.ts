import { createDefaultRpcTransport, createRpc, createSolanaRpcApi, DEFAULT_RPC_CONFIG } from '@solana/kit';
import { wrapAutoSend } from "./wrapAutoSend";
import { customApiWrapper } from './customApiWrapper';
import type { ResolvedHeliusRpcApi } from './heliusRpcApi';
import { createWebhook } from '../webhooks/createWebhook';
import { CreateWebhookRequest, CreateWebhookResponse } from '../types/webhooks';


interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet";
    autoSend?: boolean;
}

interface HeliusClient extends ResolvedHeliusRpcApi {
    webhooks: {
        create(params: CreateWebhookRequest): Promise<CreateWebhookResponse>;
    }
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

    const webhooks = {
        create: (params: any) => createWebhook(apiKey, params),
    };

    return { ...rpc, webhooks } as unknown as HeliusClient;
};