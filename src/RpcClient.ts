import {
  BlockhashWithExpiryBlockHeight,
  VersionedTransaction,
  AddressLookupTableAccount,
  Transaction,
  TransactionMessage,
  TransactionInstruction,
  TransactionSignature,
  Commitment,
  Keypair,
  PublicKey,
  AccountInfo,
  GetLatestBlockhashConfig,
  RpcResponseAndContext,
  SignatureResult,
  Blockhash,
  Connection,
  ParsedAccountData,
  ComputeBudgetProgram,
} from "@solana/web3.js";
const bs58 = require("bs58");
import axios from "axios";
import { DAS } from "./types/das-types";
import { GetPriorityFeeEstimateRequest, GetPriorityFeeEstimateResponse } from "./types";

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
  * Get priority fee estimate
  * @returns {Promise<GetPriorityFeeEstimateResponse>}
  * @throws {Error}
  */
  async getPriorityFeeEstimate(
    params: GetPriorityFeeEstimateRequest
  ): Promise<GetPriorityFeeEstimateResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: this.id,
        method: "getPriorityFeeEstimate",
        params: [params],
      }, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data.result as GetPriorityFeeEstimateResponse;
    } catch (error) {
      throw new Error(`Error fetching priority fee estimate: ${error}`);
    }
  }

  /**
   * Simulate a transaction to get the total compute units consumed
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {PublicKey} payer - The public key of the payer
   * @param {AddressLookupTableAccount[]} lookupTables - The address lookup tables 
   * @returns {Promise<number | null>} - The compute units consumed, or null if unsuccessful
  */
  async getComputeUnits(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    lookupTables: AddressLookupTableAccount[]
  ): Promise<number | null> {
    const testInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...instructions,
    ];

    const testTransaction = new VersionedTransaction(
      new TransactionMessage({
        instructions: testInstructions,
        payerKey: payer,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message(lookupTables)
    );

    const rpcResponse = await this.connection.simulateTransaction(testTransaction, {
      replaceRecentBlockhash: true,
      sigVerify: false,
    });

    if (rpcResponse.value.err) {
      console.error(`Simulation error: ${rpcResponse.value.err}`);
      return null;
    }

    return rpcResponse.value.unitsConsumed || null;
  }

  /**
   * Poll a transaction to check whether it has been confirmed
   * @param {TransactionSignature} txtSig - The transaction signature
   * @returns {Promise<TransactionSignature>} - The confirmed transaction signature or an error if the confirmation times out
  */
  async pollTransactionConfirmation(txtSig: TransactionSignature): Promise<TransactionSignature> {
    // 15 second timeout
    const timeout = 15000;
    // 5 second retry interval
    const interval = 5000;
    let elapsed = 0;

    return new Promise<TransactionSignature>((resolve, reject) => {
      const intervalId = setInterval(async () => {
        elapsed += interval;

        if (elapsed >= timeout) {
          clearInterval(intervalId);
          reject(new Error(`Transaction ${txtSig}'s confirmation timed out`));
        }

        const status = await this.connection.getSignatureStatus(txtSig);

        if (status?.value?.confirmationStatus === "confirmed") {
          clearInterval(intervalId);
          resolve(txtSig);
        }
      }, interval);
    });
  }

  /**
   * Build and send an optimized transaction, and handle its confirmation status
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Keypair} fromKeypair - The sender's keypair
   * @param {boolean} skipPreflightChecks - Whether the transaction should skip preflight checks. Defaults to `true`
   * @param {number} maxRetries - The maximum number of times to retry sending the transaction to the leader. Defaults to 0
   * @returns {Promise<TransactionSignature>} - The transaction signature
  */
  async sendSmartTransaction(
    instructions: TransactionInstruction[],
    fromKeypair: Keypair,
    skipPreflightChecks: boolean = true,
    maxRetries: number = 6,
  ): Promise<TransactionSignature> {
    try {
      const pubKey = fromKeypair.publicKey;
      const recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      // Build the initial transaction to estimate the priority fee
      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = pubKey;
      transaction.sign(fromKeypair);

      // Serialize the transaction
      const serializedTransaction = bs58.encode(transaction.serialize());

      // Get the priority fee estimate based on the serialized transaction
      const priorityFeeResponse = await this.getPriorityFeeEstimate({
        transaction: serializedTransaction,
        options: { 
          recommended: true,
        },
      });

      // Add the compute unit price instruction with the estimated fee
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFeeResponse.priorityFeeEstimate || 0,
      });
      instructions.unshift(computeBudgetIx);

      // Get the optimal compute units
      const units = await this.getComputeUnits(instructions, pubKey, []);
      if (units) {
        // Add some margin to the compute units
        const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.ceil(units * 1.1),
        });

        instructions.unshift(computeUnitsIx);
      }

      // Build the optimized transaction
      const optimizedTransaction = new Transaction().add(...instructions);
      optimizedTransaction.recentBlockhash = recentBlockhash;
      optimizedTransaction.feePayer = pubKey;
      optimizedTransaction.sign(fromKeypair);

      // Re-fetch the blockhash every 4 retries, or, roughly once every minute
      const blockhashValidityThreshold = 4;

      let retryCount: number = 0;
      let txtSig: string;

      // Send the transaction with configurable retries and preflight checks
      while (retryCount <= maxRetries) {
        try {
          // Check if the blockhash needs to be refreshed based on the retry count
          if (retryCount > 0 && retryCount % blockhashValidityThreshold === 0) {
            let latestBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
            optimizedTransaction.recentBlockhash = latestBlockhash;
            optimizedTransaction.sign(fromKeypair);
          }

          txtSig = await this.connection.sendRawTransaction(optimizedTransaction.serialize(), {
            skipPreflight: skipPreflightChecks,
            maxRetries: 0,
          });

          return await this.pollTransactionConfirmation(txtSig);
        } catch (error) {
          if (retryCount === maxRetries) {
            throw new Error(`Error sending smart transaction: ${error}`);
          }

          retryCount++;
        }
      }
    } catch (error) {
      throw new Error(`Error sending smart transaction: ${error}`);
    }

    // This should not be reached if all code paths are correct (the TS compiler is getting annoyed without it)
    throw new Error("Reached an unexpected point in sendSmartTransaction");
  }
 
  /**
   * Get information about all the edition NFTs for a specific master NFT
   * @returns {Promise<DAS.GetNftEditionsResponse>}
   * @throws {Error}
   */
  async getNftEditions(
    params: DAS.GetNftEditionsRequest
  ): Promise<DAS.GetNftEditionsResponse> {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(url, {
        jsonrpc:"2.0",
        id: this.id,
        method: "getNftEditions",
        params: params,
      }, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data.result as DAS.GetNftEditionsResponse;
    } catch (error) {
      throw new Error(`Error in getNftEditions: ${error}`);
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
