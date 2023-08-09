import {
  BlockhashWithExpiryBlockHeight,
  TransactionSignature,
  Commitment,
  AccountInfo,
  GetLatestBlockhashConfig,
  RpcResponseAndContext,
  SignatureResult,
  Blockhash,
  Connection,
  ParsedAccountData,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { DAS } from "./types/das-types";
import {
  MetadataArgs,
  MintCNFTResponse,
  MintCNFTResult,
  RequiredMetadataArgs,
} from "./types";
import axios from "axios";
import {
  existingCollection,
  getAssetID,
  initCollection,
  initTree,
  loadWallet,
  mintCollectionCompressedNft,
  mintCompressedNFT,
} from "./utils/compression";

export type SendAndConfirmTransactionResponse = {
  signature: TransactionSignature;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
  blockhash: Blockhash;
  lastValidBlockHeight: number;
};
// Type for Mint cNFT request
export type MintCNFTRequest = {
  metadataArgs: RequiredMetadataArgs;
  ownerKeypair: string; // Owner keypair -- This will be used as payer as well.
  collection?: boolean | false; // True/False on whether to mint with a collection.
  treeKeypair?: string; // Public key of existing tree keypair.
  collectionMint?: PublicKey; // Public key of existing collection mint.
  dasPolling?: boolean; // Poll DAS until you get a response.
};
export class RpcClient {
  constructor(
    protected readonly connection: Connection,
    protected readonly id?: string
  ) {}

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
   * @param {DAS.GetAssetRequest | DAS.GetAssetRequest[]} id - Asset ID or an array of Asset IDs
   * @returns {Promise<DAS.GetAssetResponse | DAS.GetAssetResponse[]>}
   * @throws {Error}
   */
  async getAsset<T extends DAS.GetAssetRequest | string | string[]>(
    id: T
  ): Promise<
    T extends string[] ? DAS.GetAssetResponse[] : DAS.GetAssetResponse
  > {
    try {
      const url = `${this.connection.rpcEndpoint}`;

      let batch;
      if (Array.isArray(id)) {
        batch = id.map((e, i) => ({
          jsonrpc: "2.0",
          id: `${this.id}-${i}`,
          method: "getAsset",
          params: {
            id: e,
          },
        }));
      } else if (typeof id === "string") {
        batch = [
          {
            jsonrpc: "2.0",
            id: this.id,
            method: "getAsset",
            params: {
              id: id,
            },
          },
        ];
      } else {
        throw new Error("Invalid input. Expected string or array of strings.");
      }

      const response = await axios.post(url, batch, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = response.data[0].result;
      return result as T extends string[]
        ? DAS.GetAssetResponse[]
        : DAS.GetAssetResponse;
    } catch (error) {
      throw new Error(`Error in getAsset: ${error}`);
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
   * Mint a compressed NFT.
   * @returns {Promise<MintCNFTResponse>}
   * @throws {Error}
   */
  async mintCNFT(
    request: MintCNFTRequest
  ): Promise<MintCNFTResult | undefined> {
    try {
      const ownerKeypair = loadWallet(request.ownerKeypair);
      function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      const defaultMetadataArgs: MetadataArgs = {
        ...request.metadataArgs,
        primarySaleHappened: false,
        isMutable: false,
        editionNonce: 0,
        tokenStandard: null,
        uses: null,
        tokenProgramVersion: null,
      };
      let assetId = "";
      let treeWallet = request.treeKeypair
        ? loadWallet(request.treeKeypair)
        : Keypair.generate();
      if (!request.treeKeypair) {
        await initTree(this.connection, ownerKeypair, treeWallet);
      }
      let response: any | undefined;

      if (!request.collection) {
        const signature = await mintCompressedNFT(
          this.connection,
          defaultMetadataArgs,
          request.ownerKeypair,
          treeWallet
        );
        await delay(4000);
        const { id } = await getAssetID(
          this.connection.rpcEndpoint,
          treeWallet.publicKey
        );
        response = {
          assetId: id,
          creator: request.ownerKeypair,
          treeId: treeWallet.publicKey.toString(),
          treeKeypair: treeWallet.secretKey,
          signature: signature,
        };
        assetId = id;
      } else {
        let collectionMint = request.collectionMint;
        if (!collectionMint) {
          const collectionInfo = await initCollection(
            this.connection,
            ownerKeypair,
            request.metadataArgs.name,
            request.metadataArgs.symbol,
            request.metadataArgs.uri
          );
          collectionMint = collectionInfo.collectionMint;
        }

        const { collectionMetadataAccount, collectionMasterEditionAccount } =
          await existingCollection(collectionMint);
        const signature = await mintCollectionCompressedNft(
          this.connection,
          defaultMetadataArgs,
          request.ownerKeypair,
          treeWallet,
          collectionMint,
          collectionMetadataAccount,
          collectionMasterEditionAccount
        );
        await delay(4000);
        // Get Merkle tree data after minting the NFT
        const { id } = await getAssetID(
          this.connection.rpcEndpoint,
          treeWallet.publicKey
        );
        assetId = id;
        response = {
          assetId: id,
          creator: request.ownerKeypair,
          treeId: treeWallet.publicKey.toString(),
          treeKeypair: treeWallet.secretKey,
          signature: signature,
        };
      }

      let DAS;
      if (request.dasPolling == true) {
        try {
          DAS = await this.getAsset(assetId.toString());
        } catch (e) {
          throw new Error(`Error in retrieving from DAS: ${e}`);
        }
      }
      return {
        response: response as MintCNFTResponse,
        DAS: DAS,
      };
    } catch (e) {
      throw new Error(`Error in minting cNFT: ${e}`);
    }
  }
}
