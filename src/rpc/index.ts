import { createDefaultRpcTransport, createRpc, createSolanaRpcApi, DEFAULT_RPC_CONFIG } from '@solana/kit';
import { wrapAutoSend } from "./wrapAutoSend";
import { customApiWrapper } from './customApiWrapper';
import type { ResolvedHeliusRpcApi } from './heliusRpcApi';
import { createWebhook } from '../webhooks/createWebhook';
import { CreateWebhookRequest, UpdateWebhookRequest, Webhook } from '../types/webhooks';
import { getWebhook } from '../webhooks/getWebhook';
import { getAllWebhooks } from '../webhooks/getAllWebhooks';
import { updateWebhook } from '../webhooks/updateWebhook';

interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet";
    autoSend?: boolean;
};

interface HeliusClient extends ResolvedHeliusRpcApi {
    webhooks: {
        create(params: CreateWebhookRequest): Promise<Webhook>;
        get(webhookID: string): Promise<Webhook>;
        getAll(): Promise<Webhook[]>;
        update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
    };
};

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
        get: (webhookID: string) => getWebhook(apiKey, webhookID),
        getAll: () => getAllWebhooks(apiKey),
        update: (webhookID: string, params: UpdateWebhookRequest) => updateWebhook(apiKey, webhookID, params),
    };

    return { ...rpc, webhooks } as unknown as HeliusClient;
};