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

interface DASClientOptions {
  endpoint: "mainnet" | "devnet";
  apiKey: string;
}

export class DASClient {
  private endpointUrl: string;

  constructor(private options: DASClientOptions) {
    this.endpointUrl = this.getEndpointUrl(options.endpoint);
  }

  private getEndpointUrl(endpoint: "mainnet" | "devnet"): string {
    switch (endpoint) {
      case "mainnet":
        return "https://rpc.helius.xyz/?api-key=" + this.options.apiKey;
      case "devnet":
        return "https://devnet.helius-rpc.com/?api-key=" + this.options.apiKey;
      default:
        throw new Error("Invalid endpoint specified");
    }
  }

  /**
   * Request an allocation of lamports to the specified address
   * @returns {Promise<getAssetResponse>}
   */
  async getAsset(params: GetAsset = { 
    id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk"
  }): Promise<getAssetResponse> {
    const url = `${this.endpointUrl}`;
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
   async getAssetProof(params: GetAssetProof = { 
    id: "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss"
  }): Promise<getAssetProofResponse> {
    const url = `${this.endpointUrl}`;
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
  async getAssetsByGroup(
    params: AssetsByGroup = {
      groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
      groupKey: "collection",
      page: 1,
    }
  ): Promise<getAssetResponseList> {
    const url = `${this.endpointUrl}`;
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
  async getAssetsByOwner(
    params: AssetsByOwner = {
      ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      page: 1,
    }
  ): Promise<getAssetResponseList> {
    const url = `${this.endpointUrl}`;
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
    params: AssetsByCreator = {
      creatorAddress: "D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3",
      onlyVerified: false,
      page: 1,
    }
  ): Promise<getAssetResponseList> {
    const url = `${this.endpointUrl}`;
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
    params: AssetsByAuthority = {
      authorityAddress: "2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW",
      page: 1,
    }
  ): Promise<getAssetResponseList> {
    const url = `${this.endpointUrl}`;
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
  async searchAssets(params: SearchAssets = { 
    ownerAddress: "2k5AXX4guW9XwRQ1AKCpAuUqgWDpQpwFfpVFh3hnm2Ha",
    page: 1
  }): Promise<getAssetResponseList> {
    const url = `${this.endpointUrl}`;
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

  async getSignaturesForAsset(params: GetSignaturesForAsset = { 
    id: "8YH4ZNZRD75QGkZs5a5eeMnNGKSNTcJoRc1o1mY6bCf",
    page: 1
  }): Promise<getSignatureResponse> {
    const url = `${this.endpointUrl}`;
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
