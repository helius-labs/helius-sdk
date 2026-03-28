import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  createKeyPairSignerFromBytes,
  getSignatureFromTransaction,
  signTransaction,
  getTransactionDecoder,
  getBase64Encoder,
} from "@solana/kit";
import { authRequest } from "./utils";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { checkUsdcBalance } from "./checkBalances";
import { RPC_URL, WS_URL } from "./constants";
import type {
  CheckoutInitializeResponse,
  BuildSponsoredTxResponse,
} from "./types";

/**
 * Request the backend to build a sponsored transaction.
 * The backend creates the tx and signs as fee payer.
 */
export async function requestSponsoredTransaction(
  jwt: string,
  intent: CheckoutInitializeResponse,
  userWalletAddress: string,
  userAgent?: string
): Promise<BuildSponsoredTxResponse> {
  return authRequest<BuildSponsoredTxResponse>(
    `/checkout/${intent.id}/build-sponsored-tx`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ userWalletAddress }),
    },
    userAgent
  );
}

/**
 * Sign a backend-built transaction with the user's keypair and submit it.
 * The transaction arrives partially signed (fee payer signature present).
 */
export async function signAndSubmitSponsoredTx(
  secretKey: Uint8Array,
  transactionBase64: string,
  lastValidBlockHeight: bigint
): Promise<string> {
  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const signer = await createKeyPairSignerFromBytes(secretKey);

  // Decode the base64 wire-format transaction from the backend.
  // In @solana/codecs, "Encoder" = encodes a domain value into bytes,
  // so getBase64Encoder().encode(base64String) converts base64 → Uint8Array.
  const transactionBytes = getBase64Encoder().encode(transactionBase64);
  const transaction = getTransactionDecoder().decode(transactionBytes);

  // Add user's signature (preserves fee payer's existing signature)
  const signedTransaction = await signTransaction(
    [signer.keyPair],
    transaction
  );

  const transactionWithBlockHeight = {
    ...signedTransaction,
    lifetimeConstraint: { lastValidBlockHeight },
  };

  await sendAndConfirm(
    transactionWithBlockHeight as Parameters<typeof sendAndConfirm>[0],
    { commitment: "confirmed" }
  );

  return getSignatureFromTransaction(signedTransaction);
}

/**
 * Full sponsored payment flow: validate USDC balance, request backend-built tx,
 * sign with user keypair, and submit. Skips SOL balance check.
 */
export async function paySponsoredIntent(
  secretKey: Uint8Array,
  intent: CheckoutInitializeResponse,
  jwt: string,
  userAgent?: string
): Promise<string> {
  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);
  const amountRaw = BigInt(intent.amount) * 10_000n;

  const usdcBalance = await checkUsdcBalance(walletAddress);
  if (usdcBalance < amountRaw) {
    throw new Error(
      `Insufficient USDC. Have: ${Number(usdcBalance) / 1_000_000} USDC, need: ${intent.amount / 100} USDC. Fund address: ${walletAddress}`
    );
  }

  const { transaction, lastValidBlockHeight } =
    await requestSponsoredTransaction(jwt, intent, walletAddress, userAgent);

  return signAndSubmitSponsoredTx(
    secretKey,
    transaction,
    BigInt(lastValidBlockHeight)
  );
}
