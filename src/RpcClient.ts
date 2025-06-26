import {
  AccountInfo,
  AddressLookupTableAccount,
  Authorized,
  Blockhash,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  GetLatestBlockhashConfig,
  Keypair,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
  Signer,
  StakeProgram,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { SignerWalletAdapterProps } from '@solana/wallet-adapter-base';
import axios from 'axios';
import bs58 from 'bs58';

import {
  CreateSmartTransactionOptions,
  GetPriorityFeeEstimateRequest,
  GetPriorityFeeEstimateResponse,
  HeliusSendOptions,
  JITO_API_URLS,
  JITO_TIP_ACCOUNTS,
  JitoRegion,
  JupiterSwapParams,
  JupiterSwapResult,
  PollTransactionOptions,
  SendSmartTransactionOptions,
  SignedTransactionInput,
  SmartTransactionContext,
} from './types';
import { DAS } from './types/das-types';
import { HELIUS_VALIDATOR_PUBKEY } from './constants';

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
    commitmentOrConfig: Commitment | GetLatestBlockhashConfig = 'finalized'
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
        new PublicKey('Stake11111111111111111111111111111111111111'),
        {
          filters: [
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
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
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
          jsonrpc: '2.0',
          id: this.id,
          method: 'getAsset',
          params,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { result } = response.data;
      return result as DAS.GetAssetResponse;
    } catch (error) {
      throw new Error(`Error in getAsset: ${error}`);
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetBatch',
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetProof',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetsByGroup',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetsByOwner',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetsByCreator',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getAssetsByAuthority',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'searchAssets',
        params,
      });

      const { data } = response;
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
        jsonrpc: '2.0',
        id: this.id,
        method: 'getSignaturesForAsset',
        params,
      });

      const { data } = response;
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
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          id: this.id,
          method: 'getPriorityFeeEstimate',
          params: [params],
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.error) {
        throw new Error(
          `Error fetching priority fee estimate: ${JSON.stringify(response.data.error, null, 2)}`
        );
      }

      return response.data.result as GetPriorityFeeEstimateResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Error fetching priority fee estimate: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
      throw new Error(`Error fetching priority fee estimate: ${error}`);
    }
  }

  /**
   * Simulate a transaction to get the total compute units consumed
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {PublicKey} payer - The public key of the payer
   * @param {AddressLookupTableAccount[]} lookupTables - The address lookup tables
   * @param {Signer[]} signers - Optional signers for the transaction
   * @returns {Promise<number | null>} - The compute units consumed, or null if unsuccessful
   */
  async getComputeUnits(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    lookupTables: AddressLookupTableAccount[],
    signers?: Signer[]
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

    if (signers) {
      testTransaction.sign(signers);
    }

    const rpcResponse = await this.connection.simulateTransaction(
      testTransaction,
      {
        sigVerify: !!signers,
      }
    );

    if (rpcResponse.value.err) {
      console.error(
        `Simulation error: ${JSON.stringify(rpcResponse.value.err, null, 2)}`
      );
      return null;
    }

    return rpcResponse.value.unitsConsumed || null;
  }

  /**
   * Poll a transaction to check whether it has been confirmed
   * @param {TransactionSignature} txtSig - The transaction signature
   * @param {PollTransactionOptions} pollOptions - Optional parameters for polling
   * @returns {Promise<TransactionSignature>} - The confirmed transaction signature or an error if the confirmation times out
   */
  async pollTransactionConfirmation(
    txtSig: TransactionSignature,
    pollOptions: PollTransactionOptions = {}
  ): Promise<TransactionSignature> {
    const {
      confirmationStatuses = ['confirmed', 'finalized'],
      timeout = 60000,
      interval = 2000,
      lastValidBlockHeight,
    } = pollOptions;

    if (lastValidBlockHeight) {
      const currentHeight = await this.connection.getBlockHeight();

      if (lastValidBlockHeight - currentHeight > 150) {
        throw new Error(
          `Provided lastValidBlockHeight (${lastValidBlockHeight}) is more than 150 blocks from the current chain height (${currentHeight})`
        );
      }
    }

    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Transaction ${txtSig} not confirmed within ${timeout}ms`
        );
      }

      if (lastValidBlockHeight) {
        const currentHeight = await this.connection.getBlockHeight();

        if (currentHeight > lastValidBlockHeight) {
          const finalStatus = await this.connection.getSignatureStatus(txtSig);
          if (
            finalStatus?.value?.confirmationStatus &&
            confirmationStatuses.includes(finalStatus.value.confirmationStatus)
          ) {
            // The tx was confirmed at the boundary
            return txtSig;
          }
          throw new Error(
            `Block height has exceeded lastValidBlockHeight for tx ${txtSig}, and it was not found in a confirmed block.`
          );
        }
      }

      const status = await this.connection.getSignatureStatus(txtSig);

      if (status?.value) {
        const { confirmationStatus, err } = status.value;

        if (err) {
          throw new Error(
            `Transaction ${txtSig} failed on-chain with error: ${JSON.stringify(err)}`
          );
        }

        // If confirmed or finalized, we can stop
        if (
          confirmationStatus &&
          confirmationStatuses.includes(confirmationStatus)
        ) {
          return txtSig;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /**
   * Create a smart transaction with the provided configuration
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included in a versioned transaction. Defaults to `[]`
   * @param {CreateSmartTransactionOptions} options - Options for customizing the transaction creation process. Includes:
   *   - `feePayer` (Signer, optional): Override fee payer (defaults to first signer).
   *   - `serializeOptions` (SerializeConfig, optional): Custom serialization options for the transaction.
   *   - `priorityFeeCap` (number, optional): Maximum priority fee to pay in microlamports (for fee estimation capping).
   *
   * @returns {Promise<SmartTransactionContext>} - The transaction with blockhash, blockheight and slot
   *
   * @throws {Error} If there are issues with constructing the transaction, fetching priority fees, or computing units
   */
  async createSmartTransaction(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    options: CreateSmartTransactionOptions = {}
  ): Promise<SmartTransactionContext> {
    if (!signers.length) {
      throw new Error('The transaction must have at least one signer');
    }

    const {
      feePayer,
      serializeOptions = {
        requireAllSignatures: true,
        verifySignatures: true,
      },
      priorityFeeCap,
    } = options;

    // Check if any of the instructions provided set the compute unit price and/or limit, and throw an error if true
    const existingComputeBudgetInstructions = instructions.filter(
      (instruction) =>
        instruction.programId.equals(ComputeBudgetProgram.programId)
    );

    if (existingComputeBudgetInstructions.length > 0) {
      throw new Error(
        'Cannot provide instructions that set the compute unit price and/or limit'
      );
    }

    // For building the transaction
    const payerKey = feePayer ? feePayer.publicKey : signers[0].publicKey;
    const {
      context: { slot: minContextSlot },
      value: blockhash,
    } = await this.connection.getLatestBlockhashAndContext();
    const recentBlockhash = blockhash.blockhash;

    // Determine if we need to use a versioned transaction
    const isVersioned = lookupTables.length > 0;
    let legacyTransaction: Transaction | null = null;
    let versionedTransaction: VersionedTransaction | null = null;

    // Build the initial transaction based on whether lookup tables are present
    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions,
        payerKey,
        recentBlockhash,
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
    const serializedTransaction = bs58.encode(
      isVersioned
        ? versionedTransaction!.serialize()
        : legacyTransaction!.serialize(serializeOptions)
    );

    // Get the priority fee estimate based on the serialized transaction
    const priorityFeeEstimateResponse = await this.getPriorityFeeEstimate({
      transaction: serializedTransaction,
      options: {
        recommended: true,
      },
    });

    const { priorityFeeEstimate } = priorityFeeEstimateResponse;

    if (!priorityFeeEstimate) {
      throw new Error('Priority fee estimate not available');
    }

    // Adjust priority fee based on the cap
    let adjustedPriorityFee = priorityFeeEstimate;
    if (priorityFeeCap !== undefined) {
      adjustedPriorityFee = Math.min(priorityFeeEstimate, priorityFeeCap);
    }

    // Add the compute unit price instruction with the estimated fee
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: adjustedPriorityFee,
    });

    instructions.unshift(computeBudgetIx);

    // Get the optimal compute units
    const units = await this.getComputeUnits(
      instructions,
      payerKey,
      isVersioned ? lookupTables : [],
      signers
    );

    if (!units) {
      throw new Error(
        `Error fetching compute units for the instructions provided`
      );
    }

    // For very small transactions, such as simple transfers, default to 1k CUs
    const customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.1);

    const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCU,
    });

    instructions.unshift(computeUnitsIx);

    // Rebuild the transaction with the final instructions
    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions,
        payerKey,
        recentBlockhash,
      }).compileToV0Message(lookupTables);

      versionedTransaction = new VersionedTransaction(v0Message);

      const allSigners = feePayer ? [...signers, feePayer] : signers;
      versionedTransaction.sign(allSigners);

      return {
        transaction: versionedTransaction,
        blockhash,
        minContextSlot,
      };
    }
    legacyTransaction = new Transaction().add(...instructions);
    legacyTransaction.recentBlockhash = recentBlockhash;
    legacyTransaction.feePayer = payerKey;

    for (const signer of signers) {
      legacyTransaction.partialSign(signer);
    }

    if (feePayer) {
      legacyTransaction.partialSign(feePayer);
    }

    return {
      transaction: legacyTransaction,
      blockhash,
      minContextSlot,
    };
  }

  /**
   * Build and send an optimized transaction, and handle its confirmation status
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer
   * @param {AddressLookupTableAccount[]} [lookupTables=[]] - The lookup tables to be included in a versioned transaction
   * @param {SendSmartTransactionOptions} [sendOptions={}] - Options for customizing the transaction sending process. Includes:
   *   - `lastValidBlockHeightOffset` (number, optional, default=150): Offset added to current block height to compute expiration. Must be positive.
   *   - `pollTimeoutMs` (number, optional, default=60000): Total timeout (ms) for confirmation polling.
   *   - `pollIntervalMs` (number, optional, default=2000): Interval (ms) between polling attempts.
   *   - `pollChunkMs` (number, optional, default=10000): Timeout (ms) for each individual polling chunk.
   *   - `skipPreflight` (boolean, optional, default=false): Skip preflight transaction checks if true.
   *   - `preflightCommitment` (Commitment, optional, default='confirmed'): Commitment level for preflight checks.
   *   - `maxRetries` (number, optional): Maximum number of retries for sending the transaction.
   *   - `minContextSlot` (number, optional): Minimum slot at which to fetch blockhash (prevents stale blockhash usage).
   *   - `feePayer` (Signer, optional): Override fee payer (defaults to first signer).
   *   - `priorityFeeCap` (number, optional): Maximum priority fee to pay in microlamports (for fee estimation capping).
   *   - `serializeOptions` (SerializeConfig, optional): Custom serialization options for the transaction.
   *
   * @returns {Promise<TransactionSignature>} - The transaction signature
   *
   * @throws {Error} If the transaction fails to confirm within the specified parameters
   */
  async sendSmartTransaction(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    sendOptions: SendSmartTransactionOptions = {}
  ): Promise<TransactionSignature> {
    try {
      const { transaction } = await this.createSmartTransaction(
        instructions,
        signers,
        lookupTables,
        sendOptions,
      );
  
      return this.broadcastTransaction(transaction, sendOptions);
    } catch (error) {
      throw new Error(`Error sending smart transaction: ${error}`);
    }
  }

  /**
   * Creates a smart transaction using a wallet adapter's signing functionality
   *
   * Instead of requiring signers, this method accepts a signTransaction function, which is
   * provided by wallet adapters
   *
   *
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {PublicKey} payer - The public key that will pay for the transaction
   * @param {SignerWalletAdapterProps['signTransaction']} signTransaction - A function (from the wallet adapter) to sign the transaction
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included in a versioned transaction. Defaults to `[]`
   * @param {CreateSmartTransactionOptions} options - Options for customizing the transaction creation process. Includes:
   *   - `feePayer` (Signer, optional): Override fee payer (defaults to first signer).
   *   - `serializeOptions` (SerializeConfig, optional): Custom serialization options for the transaction.
   *   - `priorityFeeCap` (number, optional): Maximum priority fee to pay in microlamports (for fee estimation capping).
   * @returns {Promise<SmartTransactionContext>} - The transaction with blockhash, blockheight and slot
   *
   * @throws {Error} If there are issues with constructing the transaction, fetching priority fees, or computing units
   */
  async createSmartTransactionWithWalletAdapter(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signTransaction: SignerWalletAdapterProps['signTransaction'],
    lookupTables: AddressLookupTableAccount[] = [],
    options: CreateSmartTransactionOptions = {}
  ): Promise<SmartTransactionContext> {
    const {
      feePayer,
      serializeOptions = {
        requireAllSignatures: true,
        verifySignatures: true,
      },
      priorityFeeCap,
    } = options;

    const existingComputeBudgetInstructions = instructions.filter(
      (instruction) =>
        instruction.programId.equals(ComputeBudgetProgram.programId)
    );

    if (existingComputeBudgetInstructions.length > 0) {
      throw new Error(
        'Cannot provide instructions that set the compute unit price and/or limit'
      );
    }

    // Determine the fee payer key (override if provided)
    const payerKey = feePayer ? feePayer.publicKey : payer;

    const {
      context: { slot: minContextSlot },
      value: blockhash,
    } = await this.connection.getLatestBlockhashAndContext();
    const recentBlockhash = blockhash.blockhash;
    const isVersioned = lookupTables.length > 0;

    // Build the initial unsigned tx
    let transaction: Transaction | VersionedTransaction;

    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions,
        payerKey,
        recentBlockhash,
      }).compileToV0Message(lookupTables);
      transaction = new VersionedTransaction(v0Message);
    } else {
      transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = payerKey;
    }

    // Serialize the unsigned tx
    const serializedTransaction = bs58.encode(
      isVersioned
        ? (transaction as VersionedTransaction).serialize()
        : (transaction as Transaction).serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          })
    );

    // Get priority fee estimate
    const priorityFeeResponse = await this.getPriorityFeeEstimate({
      transaction: serializedTransaction,
      options: { recommended: true },
    });
    const { priorityFeeEstimate } = priorityFeeResponse;

    if (!priorityFeeEstimate) {
      throw new Error('Priority fee estimate not available');
    }

    // Adjust priority fee based on the cap
    let adjustedPriorityFee = priorityFeeEstimate;

    if (priorityFeeCap !== undefined) {
      adjustedPriorityFee = Math.min(priorityFeeEstimate, priorityFeeCap);
    }

    const computeBudgetPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: adjustedPriorityFee,
    });
    instructions.unshift(computeBudgetPriceIx);

    // Simulate the tx to get the CUs consumed
    const units = await this.getComputeUnits(
      instructions,
      payerKey,
      lookupTables
    );

    if (!units) {
      throw new Error(
        'Error fetching compute units for the instructions provided'
      );
    }

    // For very small transactions, default to 1,000 CUs; otherwise, add a 10% margin
    const customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.1);
    const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCU,
    });
    instructions.unshift(computeUnitsIx);

    // Rebuild the final unsigned tx
    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions,
        payerKey,
        recentBlockhash,
      }).compileToV0Message(lookupTables);

      transaction = new VersionedTransaction(v0Message);
    } else {
      transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = payerKey;
    }

    // Use the wallet adapter's signTransaction function to sign the tx
    const signedTransaction = await signTransaction(transaction);

    return {
      transaction: signedTransaction,
      blockhash,
      minContextSlot,
    };
  }

  /**
   * Sends a smart transaction using a wallet adatpers's signing functionality
   *
   * This method builds an unsigned transaction by calling `createSmartTransactionWithWalletAdapter`, and then
   * sends it via `sendRawTransaction` and polls for confirmation
   *
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {PublicKey} payer - The public key that will pay for the transaction
   * @param {SignerWalletAdapterProps['signTransaction']} signTransaction - A function (from the wallet adapter) to sign the transaction
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included in a versioned transaction. Defaults to `[]`
   * @param {SendSmartTransactionOptions} [sendOptions={}] - Options for customizing the transaction sending process. Includes:
   *   - `lastValidBlockHeightOffset` (number, optional, default=150): Offset added to current block height to compute expiration. Must be positive.
   *   - `pollTimeoutMs` (number, optional, default=60000): Total timeout (ms) for confirmation polling.
   *   - `pollIntervalMs` (number, optional, default=2000): Interval (ms) between polling attempts.
   *   - `pollChunkMs` (number, optional, default=10000): Timeout (ms) for each individual polling chunk.
   *   - `skipPreflight` (boolean, optional, default=false): Skip preflight transaction checks if true.
   *   - `preflightCommitment` (Commitment, optional, default='confirmed'): Commitment level for preflight checks.
   *   - `maxRetries` (number, optional): Maximum number of retries for sending the transaction.
   *   - `minContextSlot` (number, optional): Minimum slot at which to fetch blockhash (prevents stale blockhash usage).
   *   - `feePayer` (Signer, optional): Override fee payer (defaults to first signer, but we override here since we're using the wallet adapter).
   *   - `priorityFeeCap` (number, optional): Maximum priority fee to pay in microlamports (for fee estimation capping).
   *   - `serializeOptions` (SerializeConfig, optional): Custom serialization options for the transaction.
   *
   * @returns {Promise<TransactionSignature>} - The transaction signature
   *
   * @throws {Error} If the transaction fails to confirm within the specified parameters
   */
  async sendSmartTransactionWithWalletAdapter(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signTransaction: SignerWalletAdapterProps['signTransaction'],
    lookupTables: AddressLookupTableAccount[] = [],
    sendOptions: SendSmartTransactionOptions = {}
  ): Promise<TransactionSignature> {
    try {
      const { transaction } = await this.createSmartTransactionWithWalletAdapter(
        instructions,
        payer,
        signTransaction,
        lookupTables,
        sendOptions,
      );
  
      return this.broadcastTransaction(transaction, sendOptions);
    } catch (error) {
      throw new Error(
        `Error sending smart transaction with wallet adapter: ${error}`
      );
    }
  }

  /**
   * Add a tip instruction to the last instruction in the bundle provided
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {PublicKey} feePayer - The public key of the fee payer
   * @param {string} tipAccount - The public key of the tip account
   * @param {number} tipAmount - The amount of lamports to tip
   */
  addTipInstruction(
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    tipAccount: string,
    tipAmount: number
  ): void {
    const tipInstruction = SystemProgram.transfer({
      fromPubkey: feePayer,
      toPubkey: new PublicKey(tipAccount),
      lamports: tipAmount,
    });

    instructions.push(tipInstruction);
  }

  /**
   * Create a smart transaction with a Jito tip
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer if a separate one isn't provided
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included. Defaults to `[]`
   * @param {number} tipAmount - The amount of lamports to tip. Defaults to 1000
   * @param {SmartTransactionOptions} options - Additional options for customizing the transaction (see `createSmartTransaction`)
   *
   * @returns {Promise<{ serializedTransaction: string, lastValidBlockHeight: number }>} - The serialized transaction
   *
   * @throws {Error} If there are issues with constructing the transaction or fetching the priority fees
   */
  async createSmartTransactionWithTip(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    tipAmount: number = 1000,
    options: CreateSmartTransactionOptions = {}
  ): Promise<SmartTransactionContext> {
    if (!signers.length) {
      throw new Error('The transaction must have at least one signer');
    }

    // Select a random tip account
    const randomTipAccount =
      JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];

    // Set the fee payer and add the tip instruction
    const payerKey = options.feePayer
      ? options.feePayer.publicKey
      : signers[0].publicKey;
    this.addTipInstruction(instructions, payerKey, randomTipAccount, tipAmount);

    return this.createSmartTransaction(
      instructions,
      signers,
      lookupTables,
      options
    );
  }

  /**
   * Send a bundle of transactions to the Jito Block Engine
   * @param {string[]} serializedTransactions - The serialized transactions in the bundle
   * @param {string} jitoApiUrl - The Jito Block Engine API URL
   * @returns {Promise<string>} - The bundle ID
   */
  async sendJitoBundle(
    serializedTransactions: string[],
    jitoApiUrl: string
  ): Promise<string> {
    const response = await axios.post(
      jitoApiUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.error) {
      throw new Error(
        `Error sending bundles: ${JSON.stringify(response.data.error, null, 2)}`
      );
    }

    return response.data.result;
  }

  /**
   * Get the status of Jito bundles
   * @param {string[]} bundleIds - An array of bundle IDs to check the status for
   * @param {string} jitoApiUrl - The Jito Block Engine API URL
   * @returns {Promise<any>} - The status of the bundles
   */
  async getBundleStatuses(
    bundleIds: string[],
    jitoApiUrl: string
  ): Promise<any> {
    const response = await axios.post(
      jitoApiUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBundleStatuses',
        params: [bundleIds],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.error) {
      throw new Error(
        `Error getting bundle statuses: ${JSON.stringify(response.data.error, null, 2)}`
      );
    }

    return response.data.result;
  }

  /**
   * Send a smart transaction as a Jito bundle with a tip
   * @param {TransactionInstruction[]} instructions - The transaction instructions
   * @param {Signer[]} signers - The transaction's signers. The first signer should be the fee payer if a separate one isn't provided
   * @param {AddressLookupTableAccount[]} lookupTables - The lookup tables to be included. Defaults to `[]`
   * @param {number} tipAmount - The amount of lamports to tip. Defaults to 1000
   * @param {JitoRegion} region - The Jito Block Engine region. Defaults to "Default" (i.e., https://mainnet.block-engine.jito.wtf)
   * @param {SmartTransactionOptions} options - Options for customizing the transaction and bundle sending
   *
   * @returns {Promise<string>} - The bundle ID of the sent transaction
   *
   * @throws {Error} If the bundle fails to confirm within the specified parameters
   */
  async sendSmartTransactionWithTip(
    instructions: TransactionInstruction[],
    signers: Signer[],
    lookupTables: AddressLookupTableAccount[] = [],
    tipAmount: number = 1000,
    region: JitoRegion = 'Default',
    options: SendSmartTransactionOptions = {}
  ): Promise<string> {
    const lastValidBlockHeightOffset =
      options.lastValidBlockHeightOffset ?? 150;
    if (lastValidBlockHeightOffset < 0)
      throw new Error('lastValidBlockHeightOffset must be a positive integer');

    if (!signers.length) {
      throw new Error('The transaction must have at least one signer');
    }

    // Create the smart transaction with tip based
    const { transaction, blockhash } = await this.createSmartTransactionWithTip(
      instructions,
      signers,
      lookupTables,
      tipAmount,
      options
    );

    const serializedTransaction = bs58.encode(transaction.serialize());

    // Get the Jito API URL for the specified region
    const jitoApiUrl = `${JITO_API_URLS[region]}/api/v1/bundles`;

    // Send the transaction as a Jito Bundle
    const bundleId = await this.sendJitoBundle(
      [serializedTransaction],
      jitoApiUrl
    );

    const currentBlockHeight = await this.connection.getBlockHeight();
    const lastValidBlockHeight = Math.min(
      blockhash.lastValidBlockHeight,
      currentBlockHeight + lastValidBlockHeightOffset
    );

    // Poll for confirmation status
    const timeout = 60000; // 60 second timeout
    const interval = 5000; // 5 second interval
    const startTime = Date.now();

    while (
      Date.now() - startTime < timeout ||
      (await this.connection.getBlockHeight()) <= lastValidBlockHeight
    ) {
      const bundleStatuses = await this.getBundleStatuses(
        [bundleId],
        jitoApiUrl
      );

      if (
        bundleStatuses &&
        bundleStatuses.value &&
        bundleStatuses.value.length > 0
      ) {
        const status = bundleStatuses.value[0].confirmation_status;

        if (status === 'confirmed') {
          return bundleStatuses.value[0].transactions[0];
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Bundle failed to confirm within the timeout period');
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
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          id: this.id,
          method: 'getNftEditions',
          params,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

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
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          id: this.id,
          method: 'getTokenAccounts',
          params,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return response.data.result as DAS.GetTokenAccountsResponse;
    } catch (error) {
      throw new Error(`Error in getTokenAccounts: ${error}`);
    }
  }

  /**
   * Send a transaction
   * @param {Transaction} transaction - The transaction to send
   * @param {HeliusSendOptions} options - Options for sending the transaction
   * @returns {Promise<TransactionSignature>} - The transaction signature
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options: HeliusSendOptions = {
      skipPreflight: true,
    }
  ): Promise<TransactionSignature> {
    let rawTransaction: string;
    if (transaction instanceof VersionedTransaction) {
      rawTransaction = Buffer.from(transaction.serialize()).toString('base64');
    } else {
      rawTransaction = transaction.serialize().toString('base64');
    }

    try {
      const url = `${this.connection.rpcEndpoint}`;
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          id: this.id,
          method: 'sendTransaction',
          params: [rawTransaction, { encoding: 'base64', ...options }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.error) {
        throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
      }

      return response.data.result as TransactionSignature;
    } catch (error) {
      throw new Error(`Error sending transaction: ${error}`);
    }
  }

  /**
   * Execute a token swap using Jupiter Exchange with optimized transaction sending
   *
   * @example
   * ```typescript
   * // Basic swap: 0.01 SOL to USDC with default settings
   * const result = await helius.rpc.executeJupiterSwap({
   *   inputMint: 'So11111111111111111111111111111111111111112',  // SOL
   *   outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
   *   amount: 10000000,  // 0.01 SOL
   * }, wallet);
   *
   * // Advanced swap with custom settings for better transaction landing
   * const advancedResult = await helius.rpc.executeJupiterSwap({
   *   inputMint: 'So11111111111111111111111111111111111111112',
   *   outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
   *   amount: 10000000,
   *   slippageBps: 50,                       // 0.5% slippage
   *   priorityLevel: 'veryHigh',             // High priority for congestion
   *   maxPriorityFeeLamports: 2000000,       // Max 0.002 SOL for priority fee
   *   skipPreflight: true,                   // Skip preflight checks
   *   maxRetries: 3,                         // Retry sending 3 times if needed
   *   confirmationCommitment: 'finalized',   // Wait for finalization
   * }, wallet);
   * ```
   *
   * @param params - Swap parameters object with the following properties:
   *   - `inputMint` - Input token mint address
   *   - `outputMint` - Output token mint address
   *   - `amount` - Amount of input tokens to swap (in smallest units)
   *   - `slippageBps` - Maximum allowed slippage in basis points (1 bp = 0.01%, default: 50)
   *   - `restrictIntermediateTokens` - Whether to restrict intermediate tokens (default: true)
   *   - `wrapUnwrapSOL` - Whether to auto-wrap/unwrap SOL (default: true)
   *   - `priorityLevel` - Priority level for transaction ('low', 'medium', 'high', 'veryHigh', 'unsafeMax', default: 'high')
   *   - `maxPriorityFeeLamports` - Maximum priority fee in lamports (default: 1000000)
   *   - `skipPreflight` - Whether to skip preflight transaction checks (default: true)
   *   - `maxRetries` - Maximum number of retries when sending transaction (default: 0)
   *   - `confirmationCommitment` - Commitment level for confirming transaction ('processed', 'confirmed', 'finalized', default: 'confirmed')
   *
   * @param signer - The wallet that will execute and pay for the swap
   *
   * @returns Swap result with the following properties:
   *   - `signature` - Transaction signature (empty if failed)
   *   - `success` - Whether the swap succeeded
   *   - `error` - Error message if swap failed
   *   - `inputAmount` - Amount of tokens swapped (in smallest units)
   *   - `outputAmount` - Amount of tokens received (in smallest units)
   *   - `minimumOutputAmount` - Minimum amount guaranteed with slippage (in smallest units)
   *   - `lastValidBlockHeight` - Last valid block height for the transaction
   *   - `prioritizationFeeLamports` - Actual priority fee used
   *   - `computeUnitLimit` - Compute unit limit set for the transaction
   *   - `confirmed` - Whether transaction was confirmed
   *   - `confirmationStatus` - Confirmation status of transaction
   *   - `explorerUrl` - URL to view transaction on Orb
   */
  async executeJupiterSwap(
    params: JupiterSwapParams,
    signer: Signer
  ): Promise<JupiterSwapResult> {
    try {
      // Set default parameters
      const wrapUnwrapSOL = params.wrapUnwrapSOL ?? true;
      const slippageBps = params.slippageBps ?? 50; // Default to 0.5%
      const restrictIntermediateTokens =
        params.restrictIntermediateTokens ?? true;
      const priorityLevel = params.priorityLevel ?? 'high';
      const maxPriorityFeeLamports = params.maxPriorityFeeLamports ?? 1000000; // Default 0.001 SOL
      const maxRetries = params.maxRetries ?? 0;
      const skipPreflight = params.skipPreflight ?? true;
      const confirmationCommitment =
        params.confirmationCommitment ?? 'confirmed';

      // Get Jupiter quote using fetch API with updated parameters
      const quoteUrl = new URL('https://lite-api.jup.ag/swap/v1/quote');
      quoteUrl.searchParams.append('inputMint', params.inputMint);
      quoteUrl.searchParams.append('outputMint', params.outputMint);
      quoteUrl.searchParams.append('amount', params.amount.toString());
      quoteUrl.searchParams.append('slippageBps', slippageBps.toString());
      quoteUrl.searchParams.append(
        'restrictIntermediateTokens',
        restrictIntermediateTokens.toString()
      );

      const quoteResponseRaw = await fetch(quoteUrl.toString());
      if (!quoteResponseRaw.ok) {
        throw new Error(`Jupiter quote API error: ${quoteResponseRaw.status} ${quoteResponseRaw.statusText}`);
      }
      const quoteResponse = await quoteResponseRaw.json();

      if (!quoteResponse) {
        throw new Error('Failed to get Jupiter quote');
      }

      // Check for quote errors
      if (quoteResponse.error) {
        throw new Error(`Jupiter quote error: ${quoteResponse.error}`);
      }

      // Get swap transaction with optimizations for transaction landing
      const swapResponseRaw = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: signer.publicKey.toString(),
          wrapAndUnwrapSol: wrapUnwrapSOL,

          // Transaction landing optimizations
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: maxPriorityFeeLamports,
              priorityLevel: priorityLevel,
            },
          },
        }),
      });

      if (!swapResponseRaw.ok) {
        const errorText = await swapResponseRaw.text();
        throw new Error(`Jupiter swap API error: ${swapResponseRaw.status} ${swapResponseRaw.statusText} - ${errorText}`);
      }

      const swapResponse = await swapResponseRaw.json();

      // Enhanced error handling for swap response
      if (swapResponse.error) {
        throw new Error(`Jupiter swap error: ${swapResponse.error}`);
      }

      if (!swapResponse?.swapTransaction) {
        console.error('Swap response:', JSON.stringify(swapResponse, null, 2));
        throw new Error('Failed to get swap transaction - response missing swapTransaction field');
      }

      // Deserialize transaction from base64 format
      const swapTransactionBuf = Buffer.from(
        swapResponse.swapTransaction,
        'base64'
      );
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction
      transaction.sign([signer]);

      // Serialize to binary format for sending
      const serializedTransaction = transaction.serialize();

      // Send the transaction with options for better landing
      const signature = await this.connection.sendRawTransaction(
        serializedTransaction,
        {
          skipPreflight,
          maxRetries,
        }
      );

      // Confirm the transaction and check for errors
      const confirmation = await this.connection.confirmTransaction(
        signature,
        confirmationCommitment
      );

      // Return detailed result with confirmation status
      return {
        signature,
        success: confirmation.value.err ? false : true,
        error: confirmation.value.err
          ? JSON.stringify(confirmation.value.err)
          : undefined,
        inputAmount: params.amount,
        outputAmount: Number(quoteResponse.outAmount),
        minimumOutputAmount: Number(quoteResponse.otherAmountThreshold),
        lastValidBlockHeight: swapResponse.lastValidBlockHeight,
        prioritizationFeeLamports: swapResponse.prioritizationFeeLamports,
        computeUnitLimit: swapResponse.computeUnitLimit,
        confirmed: confirmation.value.err ? false : true,
        confirmationStatus: confirmation.context.slot ? 'confirmed' : undefined,
        explorerUrl: `https://orb.helius.dev/tx/${signature}`,
      };
    } catch (error) {
      console.error('Jupiter swap error:', error);
      return {
        signature: '',
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate an unsigned, serialized transaction to create and delegate a new stake account with the Helius validator
   * This transaction must be signed by the funder's wallet before sending
   *
   * @param {PublicKey} owner - The wallet that will fund and authorize the stake
   * @param {number} amountSol - The amount of SOL to stake (excluding rent exemption)
   * @returns {Promise<{ serializedTx: string, stakeAccountPubkey: PublicKey }>}
   */
  async createStakeTransaction(
    owner: PublicKey,
    amountSol: number
  ): Promise<{ serializedTx: string; stakeAccountPubkey: PublicKey }> {
    const rentExempt = await this.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space
    );
    const lamports = amountSol * LAMPORTS_PER_SOL + rentExempt;
    const stakeAccount = Keypair.generate();

    const transaction = StakeProgram.createAccount({
      fromPubkey: owner,
      stakePubkey: stakeAccount.publicKey,
      lamports,
      authorized: new Authorized(owner, owner),
    });

    transaction.add(
      StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: owner,
        votePubkey: HELIUS_VALIDATOR_PUBKEY,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    transaction.partialSign(stakeAccount);

    const serializedTx = bs58.encode(
      transaction.serialize({ requireAllSignatures: false })
    );

    return {
      serializedTx,
      stakeAccountPubkey: stakeAccount.publicKey,
    };
  }

  /**
   * Create an unsigned transaction to deactivate a stake account
   * @param {PublicKey} owner - The wallet that authorized the stake
   * @param {PublicKey} stakeAccountPubkey - The stake account to deactivate
   * @returns {Promise<string>} - Base58 serialized unsigned transaction
   */
  async createUnstakeTransaction(
    owner: PublicKey,
    stakeAccountPubkey: PublicKey
  ): Promise<string> {
    const transaction = StakeProgram.deactivate({
      authorizedPubkey: owner,
      stakePubkey: stakeAccountPubkey,
    });

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    return bs58.encode(transaction.serialize({ requireAllSignatures: false }));
  }

  /**
   * Create an unsigned transaction to withdraw lamports from a stake account
   * This must be called **after** the cooldown period (i.e., once the stake is inactive).
   *
   * @param {PublicKey} owner - The wallet that authorized the stake
   * @param {PublicKey} stakeAccountPubkey - The stake account to withdraw from
   * @param {PublicKey} destination - The wallet that will receive the withdrawn SOL
   * @param {number} amountLamports - The amount of lamports to withdraw
   * @returns {Promise<string>} - Base58 serialized unsigned transaction
   */
  async createWithdrawTransaction(
    owner: PublicKey,
    stakeAccountPubkey: PublicKey,
    destination: PublicKey,
    amountLamports: number
  ): Promise<string> {
    const transaction = StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: owner,
      toPubkey: destination,
      lamports: amountLamports,
    });

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    return bs58.encode(transaction.serialize({ requireAllSignatures: false }));
  }

  /**
   * Fetch all stake accounts owned by a wallet and delegated to Helius
   * @param {string} wallet - The base58-encoded wallet address
   * @returns {Promise<any[]>} - The stake accounts delegated to Helius
   */
  async getHeliusStakeAccounts(wallet: string): Promise<any[]> {
    const allStakeAccounts = await this.connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [
          {
            memcmp: {
              offset: 44,
              bytes: wallet,
            },
          },
        ],
      }
    );

    return allStakeAccounts.filter(
      (acc) =>
        'parsed' in acc.account.data &&
        acc.account.data.parsed?.info?.stake?.delegation?.voter ===
          HELIUS_VALIDATOR_PUBKEY.toBase58()
    );
  }

  /**
   * Get the amount of lamports that can be withdrawn from a stake account
   *
   * This checks whether the account is fully inactive (i.e., deactivated and cooled down),
   * and subtracts the rent-exempt minimum balance if applicable
   *
   * If `includeRentExempt` is `true`, it returns the entire balance, allowing the user to
   * close the stake account
   *
   * @param {PublicKey} stakeAccountPubkey - The stake account to inspect
   * @param {boolean} [includeRentExempt=false] - Whether to include the rent-exempt reserve in the amount
   * @returns {Promise<number>} - The number of lamports available for withdrawal (0 if none)
   */
  async getWithdrawableAmount(
    stakeAccountPubkey: PublicKey,
    includeRentExempt: boolean = false
  ): Promise<number> {
    const accountInfo =
      await this.connection.getParsedAccountInfo(stakeAccountPubkey);

    if (!accountInfo || !accountInfo.value) {
      throw new Error('Stake account not found');
    }

    const parsed = accountInfo.value.data as ParsedAccountData;
    const info = parsed.parsed.info;
    const lamports = accountInfo.value.lamports;

    // If it's not a stake account
    if (!info?.meta || (!info?.stake && info?.meta?.type !== 'initialized')) {
      throw new Error('Not a valid stake account');
    }

    // Deactivation epoch check (active stake accounts are set to u64's max value)
    const U64_MAX = '18446744073709551615';
    const deactivationEpoch = parseInt(
      info?.stake?.delegation?.deactivationEpoch ?? U64_MAX
    );
    const currentEpoch = await this.connection
      .getEpochInfo()
      .then((e) => e.epoch);

    // If still active (not yet cooled down), return 0
    if (deactivationEpoch > currentEpoch) return 0;

    if (includeRentExempt) return lamports;

    const rentExempt = await this.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space
    );
    return Math.max(0, lamports - rentExempt);
  }

  /**
   * Generate instructions to create and delegate a new stake account with Helius
   *
   * @param {PublicKey} owner - The wallet that will fund and authorize the stake
   * @param {number} amountSol - The amount of SOL to stake (excluding rent exemption)
   * @returns {Promise<{ instructions: TransactionInstruction[], stakeAccount: Keypair }>}
   */
  async getStakeInstructions(
    owner: PublicKey,
    amountSol: number
  ): Promise<{
    instructions: TransactionInstruction[];
    stakeAccount: Keypair;
  }> {
    const rentExempt = await this.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space
    );
    const lamports = amountSol * LAMPORTS_PER_SOL + rentExempt;
    const stakeAccount = Keypair.generate();

    const createStakeTx = StakeProgram.createAccount({
      fromPubkey: owner,
      stakePubkey: stakeAccount.publicKey,
      lamports,
      authorized: new Authorized(owner, owner),
    });

    const delegateTx = StakeProgram.delegate({
      stakePubkey: stakeAccount.publicKey,
      authorizedPubkey: owner,
      votePubkey: HELIUS_VALIDATOR_PUBKEY,
    });

    const instructions = [
      ...createStakeTx.instructions,
      ...delegateTx.instructions,
    ];

    return {
      instructions,
      stakeAccount,
    };
  }

  /**
   * Generate an instruction to deactivate a stake account
   *
   * @param {PublicKey} owner - The wallet that authorized the stake
   * @param {PublicKey} stakeAccountPubkey - The stake account to deactivate
   * @returns {TransactionInstruction}
   */
  getUnstakeInstruction(
    owner: PublicKey,
    stakeAccountPubkey: PublicKey
  ): TransactionInstruction {
    return StakeProgram.deactivate({
      authorizedPubkey: owner,
      stakePubkey: stakeAccountPubkey,
    }).instructions[0];
  }

  /**
   * Generate an instruction to withdraw lamports from a stake account
   *
   * This should only be called **after** the stake account has been deactivated
   * and the cooldown period (~2 epochs) has completed
   *
   * If you withdraw the full balance, the stake account can be closed
   *
   * @param {PublicKey} owner - The wallet that authorized the stake and can withdraw
   * @param {PublicKey} stakeAccountPubkey - The stake account to withdraw from
   * @param {PublicKey} destination - The account that will receive the withdrawn lamports
   * @param {number} amountLamports - The amount of lamports to withdraw
   * @returns {TransactionInstruction} - The instruction to include in a transaction
   */
  getWithdrawInstruction(
    owner: PublicKey,
    stakeAccountPubkey: PublicKey,
    destination: PublicKey,
    amountLamports: number
  ): TransactionInstruction {
    return StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: owner,
      toPubkey: destination,
      lamports: amountLamports,
    }).instructions[0];
  }

  /**
   * Broadcasts a fully signed transaction (object or serialized) and polls for its confirmation
   *
   * Automatically extracts the recentBlockhash if a `Transaction` is passed
   *
   * @param {SignedTransactionInput} transaction - Fully signed transaction (object or serialized)
   * @param {SendSmartTransactionOptions} [options={}] - Options for customizing the send and confirmation process
   *
   * @returns {Promise<TransactionSignature>} - Resolves with the transaction signature once confirmed
   *
   * @throws {Error} If the transaction fails to confirm within the timeout, fails on-chain, `lastValidBlockHeightOffset` is negative, 
   * or the blockhash exceeds the block height
   */
  async broadcastTransaction(
    transaction: SignedTransactionInput,
    options: SendSmartTransactionOptions = {}
  ): Promise<string> {
    const {
      lastValidBlockHeightOffset = 150,
      pollTimeoutMs = 60000,
      pollIntervalMs = 2000,
      pollChunkMs = 10000,
      skipPreflight = false,
      preflightCommitment = 'confirmed',
      maxRetries = 0,
    } = options;

    if (lastValidBlockHeightOffset < 0) {
      throw new Error('lastValidBlockHeightOffset must be a positive integer');
    }

    let serializedTx: Buffer;
    let recentBlockhash: string | undefined;

    try {
      if (transaction instanceof Transaction) {
        serializedTx = transaction.serialize();
        recentBlockhash = transaction.recentBlockhash;
      } else if (transaction instanceof VersionedTransaction) {
        serializedTx = Buffer.from(transaction.serialize());
        recentBlockhash = transaction.message.recentBlockhash;
      } else if (Buffer.isBuffer(transaction)) {
        serializedTx = transaction;
        recentBlockhash = undefined; // Cannot extract
      } else if (typeof transaction === 'string') {
        serializedTx = Buffer.from(transaction, 'base64');
        recentBlockhash = undefined; // Cannot extract
      } else {
        throw new Error('Unsupported transaction input type.');
      }

      // Fallback to latest blockhash info if none is present
      if (!recentBlockhash) {
        console.warn(
          'No recentBlockhash found in serialized transaction; using latest blockhash info'
        );
      }

      const blockhashInfo =
        await this.connection.getLatestBlockhash(preflightCommitment);
      const currentBlockHeight = await this.connection.getBlockHeight();
      const lastValidBlockHeight = Math.min(
        blockhashInfo.lastValidBlockHeight,
        currentBlockHeight + lastValidBlockHeightOffset
      );

      const startTime = Date.now();
      let attemptCount = 0;
      let signature: string;

      while (true) {
        if (Date.now() - startTime > pollTimeoutMs) {
          throw new Error(`Transaction not confirmed after ${pollTimeoutMs}ms`);
        }

        attemptCount++;

        try {
          signature = await this.connection.sendRawTransaction(serializedTx, {
            skipPreflight,
            preflightCommitment,
            maxRetries,
          });
        } catch (sendError) {
          console.warn(
            `sendRawTransaction attempt ${attemptCount} failed: ${sendError}`
          );
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          continue;
        }

        try {
          const confirmedSig = await this.pollTransactionConfirmation(
            signature,
            {
              timeout: pollChunkMs,
              interval: pollIntervalMs,
              confirmationStatuses: ['confirmed', 'finalized'],
              lastValidBlockHeight,
            }
          );
          return confirmedSig;
        } catch (pollError: any) {
          if (
            pollError.message.includes('Block height has exceeded') ||
            pollError.message.includes('failed on-chain')
          ) {
            throw pollError;
          }

          console.warn(
            `pollTransactionConfirmation timed out, attempt #${attemptCount}. Retrying...`
          );

          const status = await this.connection.getSignatureStatus(signature);
          if (status?.value?.confirmationStatus && !status.value.err) {
            const { confirmationStatus } = status.value;
            if (['confirmed', 'finalized'].includes(confirmationStatus)) {
              console.info(
                `Transaction ${signature} was confirmed despite polling failure. Returning successful`
              );
              return signature;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          continue;
        }
      }
    } catch (error) {
      throw new Error(`Error broadcasting signed smart transaction: ${error}`);
    }
  }
}
