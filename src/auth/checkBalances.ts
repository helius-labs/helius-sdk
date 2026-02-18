import { createSolanaRpc, address as toAddress } from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { RPC_URL, USDC_MINT } from "./constants";

export async function checkSolBalance(walletAddress: string): Promise<bigint> {
  const rpc = createSolanaRpc(RPC_URL);
  const response = await rpc.getBalance(toAddress(walletAddress)).send();
  return response.value;
}

export async function checkUsdcBalance(walletAddress: string): Promise<bigint> {
  const rpc = createSolanaRpc(RPC_URL);

  const [ata] = await findAssociatedTokenPda({
    owner: toAddress(walletAddress),
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  try {
    const response = await rpc.getTokenAccountBalance(ata).send();
    return BigInt(response.value.amount);
  } catch {
    // Token account doesn't exist yet — no USDC balance
    return 0n;
  }
}
