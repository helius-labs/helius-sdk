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
      return `https://rpc-devnet.helius.xyz/?api-key=${apiKey}`;
    case "mainnet-beta":
      return `https://rpc.helius.xyz/?api-key=${apiKey}`;
    default:
      return "";
  }
}
