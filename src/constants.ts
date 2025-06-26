import { PublicKey } from '@solana/web3.js';

/**
 * URL for the SFDP (Solana Foundation Delegation Program) Rejects list.
 * This can be used with the validatorAcls parameter to exclude certain validators.
 */
export const SFDP_REJECTS_URL =
  'https://helius-docs.s3.us-east-2.amazonaws.com/sfdp_rejects.json';

export const HELIUS_VALIDATOR_PUBKEY = new PublicKey(
  'he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk'
);
