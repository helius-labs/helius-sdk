import { HeliusCluster, MintApiAuthority } from '../types';

export function mintApiAuthority(cluster: HeliusCluster) {
  switch (cluster) {
    case 'devnet':
      return MintApiAuthority.DEVNET;
    case 'mainnet-beta':
      return MintApiAuthority.MAINNET;
    default:
      throw new Error('Invalid cluster');
  }
}
