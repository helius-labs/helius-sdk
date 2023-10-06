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
} from "./types";

import axios, { type AxiosError } from "axios";
import { Connection, Cluster } from "@solana/web3.js";
import { heliusClusterApiUrl } from "./utils";
import { RpcClient } from "./RpcClient";

const API_URL_V0: string = "https://api.helius.xyz/v0";
const API_URL_V1: string = "https://api.helius.xyz/v1";

/**
 * This is the base level class for interfacing with all Helius API methods.
 * @class
 */
export class Helius {
  /**
   * API key generated at dev.helius.xyz
   * @private
   */
  private apiKey: string;

  /** The cluster in which the connection endpoint belongs to */
  public readonly cluster: Cluster;

  /** URL to the fullnode JSON RPC endpoint */
  public readonly endpoint: string;

  /** The connection object from Solana's SDK */
  public readonly connection: Connection;

  /** The beefed up RPC client object from Helius SDK */
  public readonly rpc: RpcClient;

  /**
   * Initializes Helius API client with an API key
   * @constructor
   * @param apiKey - API key generated at dev.helius.xyz
   */
  constructor(
    apiKey: string,
    cluster: Cluster = "mainnet-beta",
    id: string = "helius-sdk"
  ) {
    this.apiKey = apiKey;
    this.cluster = cluster;
    this.endpoint = heliusClusterApiUrl(apiKey, cluster);
    this.connection = new Connection(this.endpoint);
    this.rpc = new RpcClient(this.connection, id);
  }
  /**
   * Retrieves a list of all webhooks associated with the current API key
   * @returns {Promise<Webhook[]>} a promise that resolves to an array of webhook objects
   * @throws {Error} if there is an error calling the webhooks endpoint or if the response contains an error
   */
  async getAllWebhooks(): Promise<Webhook[]> {
    try {
      const { data } = await axios.get(
        `${API_URL_V0}/webhooks?api-key=${this.apiKey}`
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
        `${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`
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
        `${API_URL_V0}/webhooks?api-key=${this.apiKey}`,
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
        `${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`
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
        `${API_URL_V1}/mintlist?api-key=${this.apiKey}`,
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
      `${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`,
      editRequest
    );
    return data;
  }
}
