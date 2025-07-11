import { createSolanaRpc } from "@solana/kit";
import { wrapAutoSend } from "./wrapAutoSend";

interface HeliusRpcOptions {
    apiKey: string;
    network?: "mainnet" | "devnet";
    autoSend?: boolean;
}

export const createHeliusRpc = ({ apiKey, network = "mainnet", autoSend = true }: HeliusRpcOptions) => {
    const baseUrl = `https://${network}.helius-rpc.com`;
    const url = `${baseUrl}?api-key=${apiKey}`;
    const rpc = createSolanaRpc(url);

    return autoSend ? wrapAutoSend(rpc) : rpc;
};