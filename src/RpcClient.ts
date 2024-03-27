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
import axios from "axios";
import { DAS } from "./types/das-types";

export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
  blockhash: Blockhash;
  lastValidBlockHeight: number;
};

/**
 * The beefed up RPC client from Helius SDK
 */
export class RpcClient {
  constructor(
    protected readonly connection: Connection,
    protected readonly id?: string
  ) { }

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
   * Get a single asset by ID.
   * @param {DAS.GetAssetRequest | string} id - Asset ID
   * @returns {Promise<DAS.GetAssetResponse>}
   * @throws {Error}
   */
  async getAsset(
    params: DAS.GetAssetRequest | string
  ): Promise<DAS.GetAssetResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;

      const response = await axios.post(
        url,
        {
          jsonrpc: "2.0",
          id: this.id,
          method: "getAsset",
          params,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data.result;
      return result as DAS.GetAssetResponse;
    } catch (error) {
      throw new Error(`Error in getAsset: ${error}`);
    }
  }

  /**
   * Get RWA Asset by mint.
   * @param {DAS.GetRwaAssetRequest} - RWA Asset ID
   * @returns {Promise<DAS.GetRwaAssetResponse>}
   * @throws {Error}
   */
  async getRwaAsset(
    params: DAS.GetRwaAssetRequest
  ): Promise<DAS.GetRwaAssetResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(
        url,
        {
          jsonrpc: "2.0",
          id: this.id,
          method: "getRwaAccountsByMint",
          params,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data.result;
      return result as DAS.GetRwaAssetResponse;
    } catch (error) {
      throw new Error(`Error in getRwaAsset: ${error}`);
    }
  }

  /**
   * Get multiple assets.
   * @returns {Promise<DAS.GetAssetResponse[]>}
   * @throws {Error}
   */
  async getAssetBatch(
    params: DAS.GetAssetBatchRequest
  ): Promise<DAS.GetAssetResponse[]> {
    try {
      const url = `${this.connection.rpcEndpoint}`;

      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetBatch",
        params, // <-- Here we directly pass the params
      });

      return response.data.result as DAS.GetAssetResponse[];
    } catch (error) {
      throw new Error(`Error in getAssetBatch: ${error}`);
    }
  }
  /**
   * Get Asset proof.
   * @returns {Promise<DAS.GetAssetProofResponse>}
   * @throws {Error}
   */
  async getAssetProof(
    params: DAS.GetAssetProofRequest
  ): Promise<DAS.GetAssetProofResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetProof",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetProofResponse;
    } catch (error) {
      throw new Error(`Error in getAssetProof: ${error}`);
    }
  }

  /**
   * Get Assets By group.
   * @returns {Promise<DAS.GetAssetResponseList>}
   * @throws { Error }
   */
  async getAssetsByGroup(
    params: DAS.AssetsByGroupRequest
  ): Promise<DAS.GetAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetsByGroup",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByGroup: ${error}`);
    }
  }

  /**
   * Get all assets (compressed and regular) for a public key.
   * @returns {Promise<DAS.GetAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByOwner(
    params: DAS.AssetsByOwnerRequest
  ): Promise<DAS.GetAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetsByOwner",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByOwner: ${error}`);
    }
  }

  /**
   * Request assets for a given creator.
   * @returns {Promise<DAS.GetAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByCreator(
    params: DAS.AssetsByCreatorRequest
  ): Promise<DAS.GetAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetsByCreator",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByCreator: ${error}`);
    }
  }

  /**
   * Get assets by authority.
   * @returns {Promise<DAS.GetAssetResponseList>}
   * @throws {Error}
   */
  async getAssetsByAuthority(
    params: DAS.AssetsByAuthorityRequest
  ): Promise<DAS.GetAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getAssetsByAuthority",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetResponseList;
    } catch (error) {
      throw new Error(`Error in getAssetsByAuthority: ${error}`);
    }
  }

  /**
   * Search Assets
   * @returns {Promise<DAS.GetAssetResponseList>}
   * @throws {Error}
   */
  async searchAssets(
    params: DAS.SearchAssetsRequest
  ): Promise<DAS.GetAssetResponseList> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "searchAssets",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetAssetResponseList;
    } catch (error) {
      throw new Error(`Error in searchAssets: ${error}`);
    }
  }

  /**
   * Get transaction history for the asset.
   * @returns {Promise<GetSignatureForAssetResponse>}
   * @throws {Error}
   */
  async getSignaturesForAsset(
    params: DAS.GetSignaturesForAssetRequest
  ): Promise<DAS.GetSignaturesForAssetResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getSignaturesForAsset",
        params: params,
      });

      const data = response.data;
      return data.result as DAS.GetSignaturesForAssetResponse;
    } catch (error) {
      throw new Error(`Error in getSignaturesForAsset: ${error}`);
    }
  }

  /**
   * Get information about all token accounts for a specific mint or a specific owner
   * @returns {Promise<DAS.GetTokenAccountsResponse>}
   * @throws {Error}
   */
  async getTokenAccounts(
    params: DAS.GetTokenAccountsRequest
  ): Promise<DAS.GetTokenAccountsResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getTokenAccounts",
        params: params,
      }, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data.result as DAS.GetTokenAccountsResponse;
    } catch (error) {
      throw new Error(`Error in getTokenAccounts: ${error}`)
    }
  }
}
