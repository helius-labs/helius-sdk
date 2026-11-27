import {
  address,
  airdropFactory,
  lamports,
  type Address,
  type Commitment,
  type Rpc,
  type RpcSubscriptions,
  type Signature,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from "@solana/kit";

/** Options for `helius.airdrop`. */
export type AirdropOptions = {
  /** Commitment to wait for. Defaults to `"confirmed"`. */
  commitment?: Commitment;
  /** Stops waiting for confirmation. The airdrop request may already be sent. */
  abortSignal?: AbortSignal;
};

/**
 * Requests a devnet SOL airdrop and resolves with its signature once it
 * reaches the requested commitment.
 */
export type AirdropFn = (
  recipient: Address | string,
  lamports: bigint | number,
  options?: AirdropOptions
) => Promise<Signature>;

export const makeAirdrop =
  (
    rpc: Rpc<SolanaRpcApi>,
    getRpcSubscriptions: () => Promise<
      RpcSubscriptions<SolanaRpcSubscriptionsApi>
    >,
    isMainnet: boolean
  ): AirdropFn =>
  async (recipient, amount, { commitment = "confirmed", abortSignal } = {}) => {
    if (isMainnet)
      throw new Error(
        `airdrop is devnet-only. Use createHelius({ network: "devnet" }).`
      );
    const airdrop = airdropFactory({
      rpc,
      rpcSubscriptions: await getRpcSubscriptions(),
    });
    return airdrop({
      recipientAddress: address(recipient),
      lamports: lamports(BigInt(amount)),
      commitment,
      abortSignal,
    });
  };
