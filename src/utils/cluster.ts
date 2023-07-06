import { Cluster } from "@solana/web3.js";

/**
 * Retrieves the Helius RPC API URL for the specified cluster
 */
export function heliusClusterApiUrl(
  apiKey: string,
  cluster: Cluster = "devnet"
): string {
  switch (cluster) {
    case "devnet":
      return `https://devnet.helius-rpc.com/?api-key=${apiKey}`;
    case "mainnet-beta":
      return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    default:
      return "";
  }
}
