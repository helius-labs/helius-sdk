import { createKeyPairSignerFromBytes, type Instruction } from "@solana/kit";
import { USDC_MINT, MEMO_PROGRAM_ID } from "./constants";
import { buildAndSendTokenTransfer } from "./buildTokenTransfer";

export async function payWithMemo(
  secretKey: Uint8Array,
  treasuryAddress: string,
  amount: bigint,
  memo: string
): Promise<string> {
  const signer = await createKeyPairSignerFromBytes(secretKey);

  const memoIx: Instruction = {
    programAddress: MEMO_PROGRAM_ID,
    accounts: [{ address: signer.address, role: 3 /* READONLY_SIGNER */ }],
    data: new TextEncoder().encode(memo),
  };

  return buildAndSendTokenTransfer({
    secretKey,
    recipientAddress: treasuryAddress,
    mintAddress: USDC_MINT,
    amount,
    additionalInstructions: [memoIx],
  });
}
