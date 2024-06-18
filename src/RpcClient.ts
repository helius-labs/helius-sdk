import {
  BlockhashWithExpiryBlockHeight,
  VersionedTransaction,
  AddressLookupTableAccount,
  Transaction,
  TransactionMessage,
  TransactionInstruction,
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
  ComputeBudgetProgram,
  SendOptions,
  Signer,
  TransactionExpiredTimeoutError,
} from "@solana/web3.js";
const bs58 = require("bs58");
import axios from "axios";
import { DAS } from "./types/das-types";
import { GetPriorityFeeEstimateRequest, GetPriorityFeeEstimateResponse, PriorityLevel } from "./types";

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
      console.error(`Simulation error: ${JSON.stringify(rpcResponse.value.err, null, 2)}`);
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
   * Create a smart transaction with the provided configuration
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included in a versioned transaction. Defaults to `[]`
   * @param {Signer} feePayer - Optional fee payer separate from the signers
   * @returns {Promise<TransactionSignature>} - The transaction signature
  */
  async createSmartTransaction(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    feePayer?: Signer,
  ) {
    if (!signers.length) {
      throw new Error("The transaction must have at least one signer");
    }

    // Check if any of the instructions provided set the compute unit price and/or limit, and throw an error if true
    const existingComputeBudgetInstructions = instructions.filter(instruction => 
      instruction.programId.equals(ComputeBudgetProgram.programId)
    );

    if (existingComputeBudgetInstructions.length > 0) {
      throw new Error("Cannot provide instructions that set the compute unit price and/or limit");
    }

    // For building the transaction
    const payerKey = feePayer ? feePayer.publicKey : signers[0].publicKey;
    let recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

    // Determine if we need to use a versioned transaction
    const isVersioned = lookupTables.length > 0;
    let legacyTransaction: Transaction | null = null;
    let versionedTransaction: VersionedTransaction | null = null;

    // Build the initial transaction based on whether lookup tables are present
    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions: instructions,
        payerKey: payerKey,
        recentBlockhash: recentBlockhash,
      }).compileToV0Message(lookupTables);

      versionedTransaction = new VersionedTransaction(v0Message);

      // Include feePayer in signers if it exists and is not already in the list
      const allSigners = feePayer ? [...signers, feePayer] : signers;
      versionedTransaction.sign(allSigners);
    } else {
      legacyTransaction = new Transaction().add(...instructions);
      legacyTransaction.recentBlockhash = recentBlockhash;
      legacyTransaction.feePayer = payerKey;

      for (const signer of signers) {
        legacyTransaction.partialSign(signer);
      }

      if (feePayer) {
        legacyTransaction.partialSign(feePayer);
      }
    }

    // Serialize the transaction
    const serializedTransaction = bs58.encode(isVersioned ? versionedTransaction!.serialize() : legacyTransaction!.serialize());

    // Get the priority fee estimate based on the serialized transaction
    const priorityFeeEstimateResponse = await this.getPriorityFeeEstimate({
      transaction: serializedTransaction,
      options: {
        recommended: true,
      },
    });

    const priorityFeeEstimate = priorityFeeEstimateResponse.priorityFeeEstimate;

    if (!priorityFeeEstimate) {
      throw new Error("Priority fee estimate not available");
    }

    // Add the compute unit price instruction with the estimated fee
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFeeEstimate,
    });

    instructions.unshift(computeBudgetIx);


    // Get the optimal compute units
    const units = await this.getComputeUnits(instructions, payerKey, isVersioned ? lookupTables : []);

    if (!units) {
      throw new Error(`Error fetching compute units for the instructions provided`);
    }
     
    // For very small transactions, such as simple transfers, default to 1k CUs
    let customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.1);

    const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCU,
    });         
    
    instructions.unshift(computeUnitsIx);

    // Rebuild the transaction with the final instructions
    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions: instructions,
        payerKey: payerKey,
        recentBlockhash: recentBlockhash,
      }).compileToV0Message(lookupTables);

      versionedTransaction = new VersionedTransaction(v0Message);
      
      const allSigners = feePayer ? [...signers, feePayer] : signers;
      versionedTransaction.sign(allSigners);

      return versionedTransaction;
    } else {
      legacyTransaction = new Transaction().add(...instructions);
      legacyTransaction.recentBlockhash = recentBlockhash;
      legacyTransaction.feePayer = payerKey;

      for (const signer of signers) {
        legacyTransaction.partialSign(signer);
      }

      if (feePayer) {
        legacyTransaction.partialSign(feePayer);
      }

      return legacyTransaction;
    }
  }
  
  /**
   * Build and send an optimized transaction, and handle its confirmation status
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included in a versioned transaction. Defaults to `[]`
   * @param {SendOptions & { feePayer?: Signer }} sendOptions - Options for sending the transaction, including an optional feePayer. Defaults to `{ skipPreflight: false }`
   * @returns {Promise<TransactionSignature>} - The transaction signature
  */
  async sendSmartTransaction(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    sendOptions: SendOptions & { feePayer?: Signer } = { skipPreflight: false },
  ): Promise<TransactionSignature> {
    try {
      // Create a smart transaction
      const transaction = await this.createSmartTransaction(instructions, signers, lookupTables, sendOptions.feePayer);
  
      // Timeout of 60s. The transaction will be routed through our staked connections and should be confirmed by then
      const timeout = 60000;
      const startTime = Date.now();
      let txtSig;
  
      while (Date.now() - startTime < timeout) {
        try {
          txtSig = await this.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: sendOptions.skipPreflight,
            ...sendOptions,
          });
  
          return await this.pollTransactionConfirmation(txtSig);
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      throw new Error(`Error sending smart transaction: ${error}`);
    }
  
    throw new Error("Transaction failed to confirm in 60s");
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
