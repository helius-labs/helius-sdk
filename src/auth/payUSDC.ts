import { TREASURY, USDC_MINT, PAYMENT_AMOUNT } from "./constants";
import { buildAndSendTokenTransfer } from "./buildTokenTransfer";

export async function payUSDC(secretKey: Uint8Array): Promise<string> {
  return buildAndSendTokenTransfer({
    secretKey,
    recipientAddress: TREASURY,
    mintAddress: USDC_MINT,
    amount: PAYMENT_AMOUNT,
  });
}
