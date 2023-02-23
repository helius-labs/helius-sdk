import {
  BlockhashWithExpiryBlockHeight,
  TransactionSignature,
  Commitment,
  PublicKey,
  GetLatestBlockhashConfig,
  RpcResponseAndContext,
  SignatureResult,
  Blockhash,
  Connection,
} from "@solana/web3.js";

export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
  blockhash: Blockhash;
  lastValidBlockHeight: number;
};

export class RpcClient {
  constructor(protected readonly connection: Connection) {}

  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<SendAndConfirmTransactionResponse>}
   */
  async airdrop(
    publicKey: PublicKey,
    lamports: number,
    commitment?: Commitment
  ): Promise<SendAndConfirmTransactionResponse> {
    const signature = await this.connection.requestAirdrop(publicKey, lamports);

    const blockhashWithExpiryBlockHeight = await this.getLatestBlockhash();
    const confirmResponse = await this.connection.confirmTransaction(
      {
        signature,
        ...blockhashWithExpiryBlockHeight,
      },
      commitment
    );

    return { signature, confirmResponse, ...blockhashWithExpiryBlockHeight };
  }

  /**
   * Fetch the latest blockhash from the cluster
   * @returns {Promise<BlockhashWithExpiryBlockHeight>}
   */
  async getLatestBlockhash(
    commitmentOrConfig: Commitment | GetLatestBlockhashConfig = "finalized"
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return this.connection.getLatestBlockhash(commitmentOrConfig);
  }

  /**
   * Returns the current transactions per second (TPS) rate — including voting transactions.
   *
   * @returns {Promise<number>} A promise that resolves to the current TPS rate.
   * @throws {Error} If there was an error calling the `getRecentPerformanceSamples` method.
   */
  async getCurrentTPS(): Promise<number> {
    try {
      const samples = await this.connection.getRecentPerformanceSamples(1);
      return samples[0]?.numTransactions / samples[0]?.samplePeriodSecs;
    } catch (e) {
      throw new Error(`error calling getCurrentTPS: ${e}`);
    }
  }
}
