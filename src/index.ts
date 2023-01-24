import axios, { AxiosError } from "axios";
import { Webhook, CreateWebhookRequest } from "./types";

const API_URL_V0: string = "https://api.helius.xyz/v0";
const API_URL_V1: string = "https://api.heliuys.xyz/v1";

export * as Types from './types';
export class Helius {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getWebhooks(): Promise<Webhook[]> {
        try {
            const { data } = await axios.get(
                `${API_URL_V0}/webhooks?api-key=${this.apiKey}`
            );
            return data;
        } catch (err: any | AxiosError) {
            if (axios.isAxiosError(err)) {
                throw new Error(`error calling getWebhooks: ${err.response?.data.error}`)
            } else {
                throw new Error(`error calling getWebhooks: ${err}`)
            }
        }
    }

    async getWebhookByID(webhookID: string): Promise<Webhook> {
        try {
            const { data } = await axios.get(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`)
            return data
        } catch (err: any | AxiosError) {
            if (axios.isAxiosError(err)) {
                throw new Error(`error during getWebhookByID: ${err.response?.data.error}`)
            } else {
                throw new Error(`error during getWebhookByID: ${err}`)
            }
        }
    }

    async createWebhook(createWebhookRequest: CreateWebhookRequest): Promise<Webhook> {
        try {
            const { data } = await axios.post(`${API_URL_V0}/webhooks?api-key=${this.apiKey}`, { ...createWebhookRequest })
            return data;
        } catch (err: any | AxiosError) {
            if (axios.isAxiosError(err)) {
                throw new Error(`error during createWebhook: ${err.response?.data.error}`)
            } else {
                throw new Error(`error during createWebhook: ${err}`)
            }
        }
    }

    async deleteWebhook(webhookID: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`)
            return true
        } catch (err: any | AxiosError) {
            if (axios.isAxiosError(err)) {
                throw new Error(`error during deleteWebhook: ${err.response?.data.error}`)
            } else {
                throw new Error(`error during deleteWebhook: ${err}`)
            }
        }
    }

}

