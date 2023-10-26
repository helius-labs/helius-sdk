import { HeliusCluster, HeliusEndpoints } from '../types'

/**
 * Retrieves the API and RPC URLs for the specified cluster
 */
export function getHeliusEndpoints(cluster: HeliusCluster): HeliusEndpoints {
  switch (cluster) {
    case "devnet":
      return { api: "https://api-devnet.helius-rpc.com", rpc: "https://devnet.helius-rpc.com" }
    case "mainnet-beta":
      return { api: "https://api-mainnet.helius-rpc.com", rpc: "https://mainnet.helius-rpc.com" }
    default:
      throw new Error(`Unknown cluster ${cluster}`)
  }
}
