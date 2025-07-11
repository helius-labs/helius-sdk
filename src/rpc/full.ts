import { createSolanaRpc } from "@solana/kit";
import { wrapAutoSend } from "./wrapAutoSend";

// Barrel for all `installX` functions
import * as methods from "../methods";

interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet",
    autoSend?: boolean;
}

export const createHeliusRpcFull = ({ apiKey, network = "mainnet", autoSend = true }: HeliusRpcOptions) => {
    const baseUrl = `https://${network}.helius-rpc.com`;
    const url = `${baseUrl}?api-key=${apiKey}`;
    const rpc = createSolanaRpc(url);

    Object.values(methods).forEach((install) => {
        (install as (rpc: any) => void)(rpc as any);
    });

    return autoSend ? wrapAutoSend(rpc) : rpc;
};