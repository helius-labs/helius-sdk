import {
  Webhook,
  CreateWebhookRequest,
  EditWebhookRequest,
  MintApiRequest,
  MintApiResponse,
  MintApiAuthority,
  DelegateCollectionAuthorityRequest,
  RevokeCollectionAuthorityRequest,
  HeliusCluster,
  HeliusEndpoints,
  ParseTransactionsRequest,
  ParseTransactionsResponse,
} from './types';

import axios, { type AxiosError } from 'axios';
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getHeliusEndpoints } from './utils';
import { RpcClient } from './RpcClient';
import {
  ApproveCollectionAuthorityInstructionAccounts,
  RevokeCollectionAuthorityInstructionAccounts,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createApproveCollectionAuthorityInstruction,
  createRevokeCollectionAuthorityInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { mintApiAuthority } from './utils/mintApi';

/**
 * This is the base level class for interfacing with all Helius API methods.
 * @class
 */
export class Helius {
  /**
   * API key generated at dev.helius.xyz
   * @private
   */
  private apiKey?: string;

  /** The cluster in which the connection endpoint belongs to */
  public readonly cluster: HeliusCluster;

  /** URL to the fullnode JSON RPC endpoint */
  public readonly endpoint: string;

  /** URL to the API and RPC endpoints */
  public readonly endpoints: HeliusEndpoints;

  /** The connection object from Solana's SDK */
  public readonly connection: Connection;

  /** The beefed up RPC client object from Helius SDK */
  public readonly rpc: RpcClient;

  /** The Helius Mint API authority for the cluster */
  public readonly mintApiAuthority: MintApiAuthority;

  /**
   * Initializes Helius API client with an API key
   * @constructor
   * @param apiKey - API key generated at dev.helius.xyz
   * @param url - Secure RPC URL generated at dev.helius.xyz
   */
  constructor(
    apiKey: string,
    cluster: HeliusCluster = 'mainnet-beta',
    id: string = 'helius-sdk',
    url: string = ''
  ) {
    this.cluster = cluster;
    this.endpoints = getHeliusEndpoints(cluster);

    if (apiKey !== '') {
      this.apiKey = apiKey;
      this.connection = new Connection(
        `${this.endpoints.rpc}?api-key=${apiKey}`
      );
    } else if (url !== '') {
      this.connection = new Connection(url);
    } else {
      throw Error('either `apiKey` or `url` is required');
    }

    this.endpoint = this.connection.rpcEndpoint;
    this.rpc = new RpcClient(this.connection, id);
    this.mintApiAuthority = mintApiAuthority(cluster);
  }
  /**
   * Retrieves a list of all webhooks associated with the current API key
   * @returns {Promise<Webhook[]>} a promise that resolves to an array of webhook objects
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async getAllWebhooks(): Promise<Webhook[]> {
    try {
      const { data } = await axios.get(
        this.getWebhookApiEndpoint(`/v0/webhooks`)
      );
      return data;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error calling getWebhooks: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error calling getWebhooks: ${err}`);
      }
    }
  }

  /**
   * Retrieves a single webhook by its ID, associated with the current API key
   * @param {string} webhookID - the ID of the webhook to retrieve
   * @returns {Promise<Webhook>} a promise that resolves to a webhook object
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async getWebhookByID(webhookID: string): Promise<Webhook> {
    try {
      const { data } = await axios.get(
        this.getWebhookApiEndpoint(`/v0/webhooks/${webhookID}`)
      );
      return data;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during getWebhookByID: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error during getWebhookByID: ${err}`);
      }
    }
  }

  /**
   * Creates a new webhook with the provided request
   * @param {CreateWebhookRequest} createWebhookRequest - the request object containing the webhook information
   * @returns {Promise<Webhook>} a promise that resolves to the created webhook object
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async createWebhook(
    createWebhookRequest: CreateWebhookRequest
  ): Promise<Webhook> {
    try {
      const { data } = await axios.post(
        this.getWebhookApiEndpoint(`/v0/webhooks`),
        {
          ...createWebhookRequest,
        }
      );
      return data;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during createWebhook: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error during createWebhook: ${err}`);
      }
    }
  }

  /**
   * Deletes a webhook by its ID
   * @param {string} webhookID - the ID of the webhook to delete
   * @returns {Promise<boolean>} a promise that resolves to true if the webhook was successfully deleted, or false otherwise
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async deleteWebhook(webhookID: string): Promise<boolean> {
    try {
      await axios.delete(
        this.getWebhookApiEndpoint(`/v0/webhooks/${webhookID}`)
      );
      return true;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during deleteWebhook: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error during deleteWebhook: ${err}`);
      }
    }
  }

  /**
   * Edits an existing webhook by its ID with the provided request
   * @param {string} webhookID - the ID of the webhook to edit
   * @param {EditWebhookRequest} editWebhookRequest - the request object containing the webhook information
   * @returns {Promise<Webhook>} a promise that resolves to the edited webhook object
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async editWebhook(
    webhookID: string,
    editWebhookRequest: EditWebhookRequest
  ): Promise<Webhook> {
    try {
      const existing = await this.getWebhookByID(webhookID);
      return this._editWebhook(webhookID, existing, editWebhookRequest);
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during editWebhook: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error during editWebhook: ${err}`);
      }
    }
  }

  /**
   * Appends an array of addresses to an existing webhook by its ID
   * @param {string} webhookID - the ID of the webhook to edit
   * @param {string[]} newAccountAddresses - the array of addresses to be added to the webhook
   * @returns {Promise<Webhook>} a promise that resolves to the edited webhook object
   * @throws {Error} if there is an error calling the webhooks endpoint, if the response contains an error, or if the number of addresses exceeds 10,000
   */
  async appendAddressesToWebhook(
    webhookID: string,
    newAccountAddresses: string[]
  ): Promise<Webhook> {
    try {
      const webhook = await this.getWebhookByID(webhookID);
      const accountAddresses =
        webhook.accountAddresses.concat(newAccountAddresses);
      if (accountAddresses.length > 100_000) {
        throw new Error(
          `a single webhook cannot contain more than 100,000 addresses`
        );
      }
      const editRequest: EditWebhookRequest = { accountAddresses };
      return this._editWebhook(webhookID, webhook, editRequest);
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during appendAddressesToWebhook: ${
            err.response?.data.error || err
          }`
        );
      } else {
        throw new Error(`error during appendAddressesToWebhook: ${err}`);
      }
    }
  }

  /**
   * Removes an array of addresses from an existing webhook by its ID
   * @param {string} webhookID - the ID of the webhook to edit
   * @param {string[]} addressesToRemove - the array of addresses to be removed from the webhook
   * @returns {Promise<Webhook>} a promise that resolves to the edited webhook object
   * @throws {Error} if there is an error calling the webhooks endpoint, if the response contains an error
   */
  async removeAddressesFromWebhook(
    webhookID: string,
    addressesToRemove: string[]
  ): Promise<Webhook> {
    try {
      const webhook = await this.getWebhookByID(webhookID);
      // Filter out the addresses to be removed
      const accountAddresses = webhook.accountAddresses.filter(
        (address) => !addressesToRemove.includes(address)
      );
      const editRequest: EditWebhookRequest = { accountAddresses };
      return this._editWebhook(webhookID, webhook, editRequest);
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during removeAddressesFromWebhook: ${
            err.response?.data.error || err
          }`
        );
      } else {
        throw new Error(`error during removeAddressesFromWebhook: ${err}`);
      }
    }
  }

  /**
   * Mints a cNFT via Helius Mint API
   *
   * @deprecated This method is deprecated. The built-in image upload functionality has been removed.
   *             Please supply a pre-uploaded image URL using the imageUrl field in your MintApiRequest.
   *             Please refer to ZK Compression for all future compression-related work: https://docs.helius.dev/zk-compression-and-photon-api/what-is-zk-compression-on-solana
   *
   * @param {MintApiRequest} mintApiRequest - the request object containing the mint information
   * @returns {Promise<MintApiResponse>} a promise that resolves to the mint response object
   */
  async mintCompressedNft(
    mintApiRequest: MintApiRequest
  ): Promise<MintApiResponse> {
    if (mintApiRequest.imagePath || mintApiRequest.walletPrivateKey) {
      console.warn(
        'Deprecated: imagePath and walletPrivateKey are no longer supported. Please supply a pre-uploaded image URL using imageUrl.'
      );
    }

    try {
      const { data } = await axios.post(this.endpoint, {
        jsonrpc: '2.0',
        id: 'helius-test',
        method: 'mintCompressedNft',
        params: { ...mintApiRequest },
      });
      return data;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during mintCompressedNft: ${
            err.response?.data.error.message || err
          }`
        );
      } else {
        throw new Error(`error during mintCompressedNft: ${err}`);
      }
    }
  }

  /**
   * Delegates collection authority to a new address.
   * @param {DelegateCollectionAuthorityRequest} request - The request object containing the following fields:
   * @param {string} request.collectionMint - The address of the collection mint.
   * @param {string} [request.newCollectionAuthority] - The new collection authority (optional). Defaults to Helius Mint API authority if none is provided.
   * @param {Keypair} request.updateAuthorityKeypair - The keypair for the update authority for the collection.
   * @param {Keypair} [request.payerKeypair] - The keypair for the payer (optional). Defaults to the update authority keypair if none is provided.
   * @returns {Promise<string>} A promise that resolves to the transaction signature.
   */
  async delegateCollectionAuthority(
    request: DelegateCollectionAuthorityRequest
  ): Promise<string> {
    try {
      let {
        collectionMint,
        updateAuthorityKeypair,
        newCollectionAuthority,
        payerKeypair,
      } = request;

      payerKeypair = payerKeypair ?? updateAuthorityKeypair;
      newCollectionAuthority = newCollectionAuthority ?? this.mintApiAuthority;

      const collectionMintPubkey = new PublicKey(collectionMint);
      const collectionMetadata =
        this.getCollectionMetadataAccount(collectionMintPubkey);
      const newCollectionAuthorityPubkey = new PublicKey(
        newCollectionAuthority
      );
      const collectionAuthorityRecord = this.getCollectionAuthorityRecord(
        collectionMintPubkey,
        newCollectionAuthorityPubkey
      );
      const accounts: ApproveCollectionAuthorityInstructionAccounts = {
        collectionAuthorityRecord,
        newCollectionAuthority: newCollectionAuthorityPubkey,
        updateAuthority: updateAuthorityKeypair.publicKey,
        payer: payerKeypair.publicKey,
        metadata: collectionMetadata,
        mint: collectionMintPubkey,
      };
      const inx = createApproveCollectionAuthorityInstruction(accounts);
      const tx = new Transaction().add(inx);
      tx.feePayer = payerKeypair.publicKey;
      const sig = await sendAndConfirmTransaction(
        this.connection,
        tx,
        [payerKeypair, updateAuthorityKeypair],
        {
          commitment: 'confirmed',
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error('Failed to delegate collection authority: ', e);
      throw e;
    }
  }

  /**
   * Revokes collection authority from an address.
   * @param {RevokeCollectionAuthorityRequest} request - The request object containing the following fields:
   * @param {string} request.collectionMint - The address of the collection mint.
   * @param {string} [request.delegatedCollectionAuthority] - The address of the delegated collection authority (optional). Defaults to Helius Mint API authority if none is provided.
   * @param {Keypair} request.revokeAuthorityKeypair - The keypair for the authority that revokes collection access.
   * @param {Keypair} [request.payerKeypair] - The keypair for the payer (optional). Defaults to the revoke authority keypair if none is provided.
   * @returns {Promise<string>} A promise that resolves to the transaction signature.
   */
  async revokeCollectionAuthority(
    request: RevokeCollectionAuthorityRequest
  ): Promise<string> {
    try {
      let {
        collectionMint,
        revokeAuthorityKeypair,
        delegatedCollectionAuthority,
        payerKeypair,
      } = request;

      payerKeypair = payerKeypair ?? revokeAuthorityKeypair;
      delegatedCollectionAuthority =
        delegatedCollectionAuthority ?? this.mintApiAuthority;

      const collectionMintPubkey = new PublicKey(collectionMint);
      const collectionAuthority = new PublicKey(delegatedCollectionAuthority);
      const collectionMetadata =
        this.getCollectionMetadataAccount(collectionMintPubkey);
      const collectionAuthorityRecord = this.getCollectionAuthorityRecord(
        collectionMintPubkey,
        collectionAuthority
      );
      const accounts: RevokeCollectionAuthorityInstructionAccounts = {
        collectionAuthorityRecord,
        delegateAuthority: collectionAuthority,
        revokeAuthority: revokeAuthorityKeypair.publicKey,
        metadata: collectionMetadata,
        mint: collectionMintPubkey,
      };
      const inx = createRevokeCollectionAuthorityInstruction(accounts);
      const tx = new Transaction().add(inx);
      tx.feePayer = payerKeypair.publicKey;
      const sig = await sendAndConfirmTransaction(
        this.connection,
        tx,
        [revokeAuthorityKeypair],
        {
          commitment: 'confirmed',
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error('Failed to revoke collection authority: ', e);
      throw e;
    }
  }

  /**
   * Get the API endpoint for the specified path.
   * @param path - The API path to append to the base endpoint.
   * @returns The full URL to the API endpoint including the API key.
   * @throws Error if the path is not valid.
   */
  getApiEndpoint(path: string): string {
    // Check if the path starts with '/v0' or '/v1'
    if (!path.startsWith('/v0') && !path.startsWith('/v1')) {
      throw new Error(
        `Invalid API path provided: ${path}. Path must start with '/v0' or '/v1'.`
      );
    }

    if (!this.apiKey) {
      throw new Error(`API key is not set`);
    }

    // Construct and return the full API endpoint URL
    return `${this.endpoints.api}${path}?api-key=${this.apiKey}`;
  }

  /**
   * Get the webhook API endpoint for the specified path.
   * @param path - The API path to append to the base endpoint.
   * @returns The full URL to the API endpoint including the API key.
   * @throws Error if the path is not valid.
   */
  private getWebhookApiEndpoint(path: string): string {
    if (!this.apiKey) {
      throw new Error(`API key is not set`);
    }

    if (!path.startsWith('/v0')) {
      throw new Error(
        `Invalid webhook API path provided: ${path}. Path must start with '/v0'.`
      );
    }

    return `https://api.helius.xyz${path}?api-key=${this.apiKey}`;
  }

  private async _editWebhook(
    webhookID: string,
    existingWebhook: Webhook,
    editWebhookRequest: EditWebhookRequest
  ): Promise<Webhook> {
    const body: EditWebhookRequest = {
      webhookURL: editWebhookRequest.webhookURL ?? existingWebhook.webhookURL,
      transactionTypes:
        editWebhookRequest.transactionTypes ?? existingWebhook.transactionTypes,
      accountAddresses:
        editWebhookRequest.accountAddresses ?? existingWebhook.accountAddresses,
      accountAddressOwners:
        editWebhookRequest.accountAddressOwners ??
        existingWebhook.accountAddressOwners ??
        [],
      webhookType:
        editWebhookRequest.webhookType ?? existingWebhook.webhookType,
      authHeader:
        editWebhookRequest.authHeader ?? existingWebhook.authHeader ?? '',
      txnStatus: editWebhookRequest.txnStatus ?? existingWebhook.txnStatus,
      encoding: editWebhookRequest.encoding ?? existingWebhook.encoding,
    };

    Object.keys(body).forEach(
      (k) => (body as any)[k] === undefined && delete (body as any)[k]
    );

    try {
      const { data } = await axios.put(
        this.getWebhookApiEndpoint(`/v0/webhooks/${webhookID}`),
        body,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data as Webhook;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const error =
          typeof err.response?.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response?.data);
        throw new Error(`Error during _editWebhook: ${error}`);
      }
      throw err;
    }
  }

  private getCollectionAuthorityRecord(
    collectionMint: PublicKey,
    collectionAuthority: PublicKey
  ) {
    const [collectionAuthRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from('collection_authority'),
        collectionAuthority.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return collectionAuthRecordPda;
  }

  private getCollectionMetadataAccount(collectionMint: PublicKey) {
    const [collectionMetadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata', 'utf8'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return collectionMetadataAccount;
  }

  /**
   * Parse transactions.
   * @param {ParseTransactionsRequest} params - The request parameters
   * @returns {Promise<ParseTransactionsResponse>} - Array of parsed transactions
   * @throws {Error} If there was an error calling the endpoint or too many transactions to parse
   */
  async parseTransactions(
    params: ParseTransactionsRequest
  ): Promise<ParseTransactionsResponse> {
    if (params.transactions.length > 100) {
      throw new Error('The maximum number of transactions to parse is 100');
    }

    const response = await axios.post(
      this.getApiEndpoint('/v0/transactions'),
      {
        ...params,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.data.error) {
      throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
    }

    return response.data as ParseTransactionsResponse;
  }
}
