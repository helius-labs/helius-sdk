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
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponse>}
   */
  async getAsset(params: GetAsset): Promise<getAssetResponse> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAsset",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetProofResponse>}
   */
  async getAssetProof(params: GetAssetProof): Promise<getAssetProofResponse> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetProof",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponseList>}
   */
  async getAssetsByGroup(params: AssetsByGroup): Promise<getAssetResponseList> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByGroup",
        params: params,
      }),
    });
    console.log(params);
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponseList>}
   */
  async getAssetsByOwner(params: AssetsByOwner): Promise<getAssetResponseList> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByOwner",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponseList>}
   */
  async getAssetsByCreator(
    params: AssetsByCreator
  ): Promise<getAssetResponseList> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByCreator",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponseList>}
   */

  async getAssetsByAuthority(
    params: AssetsByAuthority
  ): Promise<getAssetResponseList> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByAuthority",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponseList>}
   */
  async searchAssets(params: SearchAssets): Promise<getAssetResponseList> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "searchAssets",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getSignatureResponse>}
   */

  async getSignaturesForAsset(
    params: GetSignaturesForAsset
  ): Promise<getSignatureResponse> {
    const url = `${this.connection.rpcEndpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getSignaturesForAsset",
        params: params,
      }),
    });
    const data = await response.json();
    return data.result;
  }
}
