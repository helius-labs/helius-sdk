import { Cluster } from "@solana/web3.js";
import { MintApiAuthority } from "../types";

export function mintApiAuthority(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
      return MintApiAuthority.DEVNET;
    case "mainnet-beta":
      return MintApiAuthority.MAINNET;
    default:
      throw new Error("Invalid cluster");
  }
}
