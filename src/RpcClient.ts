import axios from "axios";
import {
  BlockhashWithExpiryBlockHeight,
  TransactionSignature,
  Commitment,
  PublicKey,
  AccountInfo,
  GetLatestBlockhashConfig,
  RpcResponseAndContext,
  SignatureResult,
  Blockhash,
  Connection,
  ParsedAccountData,
} from "@solana/web3.js";
import {
  AssetsByAuthority,
  AssetsByCreator,
  AssetsByGroup,
  AssetsByOwner,
  GetAsset,
  GetAssetProof,
  GetSignaturesForAsset,
  SearchAssets,
  getAssetProofResponse,
  getAssetResponse,
  getAssetResponseList,
  getSignatureResponse,
} from "./types/das-types";

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

  /**
   * Returns all the stake accounts for a given public key
   *
   * @returns {Promise<number>} A promise that resolves to the current TPS rate.
   * @throws {Error} If there was an error calling the `getStakeAccounts` method.
   */
  async getStakeAccounts(wallet: string): Promise<any> {
    try {
      return this.connection.getParsedProgramAccounts(
        new PublicKey("Stake11111111111111111111111111111111111111"),
        {
          filters: [
            {
              dataSize: 200,
            },
            {
              memcmp: {
                offset: 44,
                bytes: wallet,
              },
            },
          ],
        }
      );
    } catch (e) {
      throw new Error(`error calling getStakeAccounts: ${e}`);
    }
  }

  /**
   * Returns all the token accounts for a given mint address (ONLY FOR SPL TOKENS)
   *
   * @returns {Promise<{pubkey: PublicKey; account: AccountInfo<ParsedAccountData | Buffer}[]>} A promise that resolves to an array of accountInfo
   * @throws {Error} If there was an error calling the `getTokenHolders` method.
   */
  getTokenHolders(mintAddress: string): Promise<
    {
      pubkey: PublicKey;
      account: AccountInfo<ParsedAccountData | Buffer>;
    }[]
  > {
    try {
      return this.connection.getParsedProgramAccounts(
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        {
          filters: [
            {
              dataSize: 165,
            },
            {
              memcmp: {
                offset: 0,
                bytes: mintAddress,
              },
            },
          ],
        }
      );
    } catch (e) {
      throw new Error(`error calling getTokenHolders: ${e}`);
    }
  }

  /**
   * Get single asset. (Note: Helius enhances these responses with a CDN for better performance)
   * @returns {Promise<getAssetResponse>}
   * @throws {Error}
   */
  async getAsset(params: GetAsset): Promise<getAssetResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAsset",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponse;
    } catch (error) {
      throw new Error(`Error in getAsset: ${error}`);
    }
  }

  /**
   * Get Asset proof.
   * @returns {Promise<getAssetProofResponse>}
   * @throws {Error}
   */
  async getAssetProof(params: GetAssetProof): Promise<getAssetProofResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetProof",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetProofResponse;
    } catch (error) {
      throw new Error(`Error in getAssetProof: ${error}`);
    }
  }

  /**
   * Get Assets By group.
   * @returns {Promise<getAssetResponseList>}
   * @throws { Error }
   */
  async getAssetsByGroup(params: AssetsByGroup): Promise<getAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByGroup",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByGroup: ${error}`);
    }
  }

  /**
   * Get all assets (compressed and regular) for a public key.
   * @returns {Promise<getAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByOwner(params: AssetsByOwner): Promise<getAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByOwner",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByOwner: ${error}`);
    }
  }

  /**
   * Request assets for a given creator.
   * @returns {Promise<getAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByCreator(
    params: AssetsByCreator
  ): Promise<getAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByCreator",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByCreator: ${error}`);
    }
  }

  /**
   * Get assets by authority.
   * @returns {Promise<getAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByAuthority(
    params: AssetsByAuthority
  ): Promise<getAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByAuthority",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByAuthority: ${error}`);
    }
  }

  /**
   * Search Assets
   * @returns {Promise<getAssetResponseList>}
   * @throws {Error}
   */
  async searchAssets(params: SearchAssets): Promise<getAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "searchAssets",
        params: params,
      });

      const data = response.data;
      return data.result as getAssetResponseList;
    } catch (error) {
      throw new Error(`Error in searchAssets: ${error}`);
    }
  }

  /**
   * Get transaction history for the asset.
   * @returns {Promise<getSignatureResponse>}
   * @throws {Error}
   */
  async getSignaturesForAsset(
    params: GetSignaturesForAsset
  ): Promise<getSignatureResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getSignaturesForAsset",
        params: params,
      });

      const data = response.data;
      return data.result as getSignatureResponse;
    } catch (error) {
      throw new Error(`Error in getSignaturesForAsset: ${error}`);
    }
  }
}
