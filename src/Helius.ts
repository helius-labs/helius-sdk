import {
  Webhook,
  CreateWebhookRequest,
  EditWebhookRequest,
  CreateCollectionWebhookRequest,
  MintlistRequest,
  MintlistResponse,
  MintlistItem,
  MintApiRequest,
  MintApiResponse,
  MintApiAuthority,
  DelegateCollectionAuthorityRequest,
  RevokeCollectionAuthorityRequest,
  HeliusCluster,
  HeliusEndpoints,
} from "./types";

import axios, { type AxiosError } from "axios";
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import Irys from "@irys/sdk";
import * as fs from "fs";
import { getHeliusEndpoints } from "./utils";
import { RpcClient } from "./RpcClient";
import {
  ApproveCollectionAuthorityInstructionAccounts,
  RevokeCollectionAuthorityInstructionAccounts,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createApproveCollectionAuthorityInstruction,
  createRevokeCollectionAuthorityInstruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { mintApiAuthority } from "./utils/mintApi";

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
    cluster: HeliusCluster = "mainnet-beta",
    id: string = "helius-sdk",
    url: string = "",
  ) {
    this.cluster = cluster;
    this.endpoints = getHeliusEndpoints(cluster);

    if (apiKey !== "") {
      this.apiKey = apiKey;
      this.connection = new Connection(`${this.endpoints.rpc}?api-key=${apiKey}`);
    } else if (url !== "") {
      this.connection = new Connection(url);
    } else {
      throw Error("either `apiKey` or `url` is required");
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
        this.getApiEndpoint(`/v0/webhooks`)
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
        this.getApiEndpoint(`/v0/webhooks/${webhookID}`)
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
        this.getApiEndpoint(`/v0/webhooks`),
        { ...createWebhookRequest }
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
        this.getApiEndpoint(`/v0/webhooks/${webhookID}`)
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
        address => !addressesToRemove.includes(address)
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

  async createCollectionWebhook(
    request: CreateCollectionWebhookRequest
  ): Promise<Webhook> {
    if (request?.collectionQuery == undefined) {
      throw new Error(`must provide collectionQuery object.`);
    }

    const { firstVerifiedCreators, verifiedCollectionAddresses } =
      request.collectionQuery;
    if (
      firstVerifiedCreators != undefined &&
      verifiedCollectionAddresses != undefined
    ) {
      throw new Error(
        `cannot provide both firstVerifiedCreators and verifiedCollectionAddresses. Please only provide one.`
      );
    }

    let mintlist: MintlistItem[] = [];
    let query = {};

    if (firstVerifiedCreators != undefined) {
      query = { firstVerifiedCreators };
    } else {
      // must have used verifiedCollectionAddresses
      query = { verifiedCollectionAddresses };
    }

    try {
      let mints = await this.getMintlist({
        query,
        options: {
          limit: 10000,
        },
      });
      mintlist.push(...mints.result);

      while (mints.paginationToken) {
        mints = await this.getMintlist({
          query,
          options: {
            limit: 10000,
            paginationToken: mints.paginationToken,
          },
        });
        mintlist.push(...mints.result);
      }

      const { webhookURL, transactionTypes, authHeader, webhookType } = request;
      const payload: CreateWebhookRequest = {
        webhookURL,
        accountAddresses: mintlist.map((x) => x.mint),
        transactionTypes,
      };
      if (authHeader) {
        payload["authHeader"] = authHeader;
      }
      if (webhookType) {
        payload["webhookType"] = webhookType;
      }

      return await this.createWebhook({ ...payload });
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during createCollectionWebhook: ${
            err.response?.data.error || err
          }`
        );
      } else {
        throw new Error(`error during createCollectionWebhook: ${err}`);
      }
    }
  }

  async getMintlist(request: MintlistRequest): Promise<MintlistResponse> {
    if (request?.query == undefined) {
      throw new Error(`must provide query object.`);
    }

    const { firstVerifiedCreators, verifiedCollectionAddresses } =
      request.query;
    if (
      firstVerifiedCreators != undefined &&
      verifiedCollectionAddresses != undefined
    ) {
      throw new Error(
        `cannot provide both firstVerifiedCreators and verifiedCollectionAddresses. Please only provide one.`
      );
    }

    try {
      const { data } = await axios.post(
        this.getApiEndpoint(`/v1/mintlist`),
        { ...request }
      );
      return data;
    } catch (err: any | AxiosError) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          `error during getMintlist: ${err.response?.data.error || err}`
        );
      } else {
        throw new Error(`error during getMintlist: ${err}`);
      }
    }
  }

  /**
   * Mints a cNFT via Helius Mint API
   * @param {MintApiRequest} mintApiRequest - the request object containing the mint information
   * @returns {Promise<MintApiResponse>} a promise that resolves to the mint response object
   */
  async mintCompressedNft(
    mintApiRequest: MintApiRequest
  ): Promise<MintApiResponse> {
    await this.handleImageUpload(mintApiRequest);
    try {
      const { data } = await axios.post(this.endpoint, {
        jsonrpc: "2.0",
        id: "helius-test",
        method: "mintCompressedNft",
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
          commitment: "confirmed",
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error("Failed to delegate collection authority: ", e);
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
          commitment: "confirmed",
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error("Failed to revoke collection authority: ", e);
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
        throw new Error(`Invalid API path provided: ${path}. Path must start with '/v0' or '/v1'.`);
    }

    if (!this.apiKey) {
        throw new Error(`API key is not set`);
    }

    // Construct and return the full API endpoint URL
    return `${this.endpoints.api}${path}?api-key=${this.apiKey}`;
  }

  private async _editWebhook(
    webhookID: string,
    existingWebhook: Webhook,
    editWebhookRequest: EditWebhookRequest
  ): Promise<Webhook> {
    const editRequest: EditWebhookRequest = {
      webhookURL: editWebhookRequest.webhookURL ?? existingWebhook.webhookURL,
      transactionTypes:
        editWebhookRequest.transactionTypes ?? existingWebhook.transactionTypes,
      accountAddresses:
        editWebhookRequest.accountAddresses ?? existingWebhook.accountAddresses,
      accountAddressOwners:
        editWebhookRequest.accountAddressOwners ??
        existingWebhook.accountAddressOwners,
      webhookType:
        editWebhookRequest.webhookType ?? existingWebhook.webhookType,
      authHeader: editWebhookRequest.authHeader ?? existingWebhook.authHeader,
      txnStatus: editWebhookRequest.txnStatus ?? existingWebhook.txnStatus,
      encoding: editWebhookRequest.encoding ?? existingWebhook.encoding,
    };

    const { data } = await axios.put(
      this.getApiEndpoint(`/v0/webhooks/${webhookID}`),
      editRequest
    );
    return data;
  }

  private async handleImageUpload(mintApiRequest: MintApiRequest) {
    if (mintApiRequest.imagePath && mintApiRequest.imageUrl) {
      throw new Error(
        "Cannot provide both imagePath and imageUrl. Please only provide one."
      );
    }

    if (mintApiRequest.imagePath && !mintApiRequest.walletPrivateKey) {
      throw new Error("Must provide wallet privateKey if providing imagePath.");
    }

    if (mintApiRequest.imagePath && mintApiRequest.walletPrivateKey) {
      mintApiRequest.imageUrl = await this.uploadImageToArweave(
        mintApiRequest.imagePath,
        mintApiRequest.walletPrivateKey
      );
    }
    delete mintApiRequest.imagePath;
    delete mintApiRequest.walletPrivateKey;
  }

  private async uploadImageToArweave(imagePath: string, privateKey: string) {
    const irys = new Irys({
      url:
        this.cluster === "mainnet-beta"
          ? "https://node2.irys.xyz"
          : "https://devnet.irys.xyz",
      token: "solana",
      key: privateKey,
      config: {
        providerUrl: this.endpoint,
      },
    });

    const stats = fs.statSync(imagePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1000;
    if (this.cluster === "devnet" || fileSizeInKB >= 200) {
      // Uploads on node2 (mainnet) are free for files under 200KB
      const price = await irys.getPrice(fileSizeInBytes);
      await irys.fund(price, 1.1);
    }

    try {
      const receipt = await irys.uploadFile(imagePath);
      const url = `https://arweave.net/${receipt.id}`;
      return url;
    } catch (e) {
      throw new Error(`error uploading image to Arweave: ${e}`);
    }
  }
  private getCollectionAuthorityRecord(
    collectionMint: PublicKey,
    collectionAuthority: PublicKey
  ) {
    const [collectionAuthRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from("collection_authority"),
        collectionAuthority.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return collectionAuthRecordPda;
  }

  private getCollectionMetadataAccount(collectionMint: PublicKey) {
    const [collectionMetadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return collectionMetadataAccount;
  }
}
