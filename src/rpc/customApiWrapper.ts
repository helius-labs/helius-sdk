import type { RpcApi, RpcPlan } from "@solana/kit";
import type { SolanaRpcApi } from "@solana/kit";
import type { HeliusRpcApi } from "./heliusRpcApi";
import type { Asset } from "../types/das";
import { GetAssetBatchRequest, GetAssetBatchResponse, GetAssetProofRequest, GetAssetProofResponse, GetAssetRequest, GetPriorityFeeEstimateRequest, GetPriorityFeeEstimateResponse } from "../types";

interface MethodConfig<P, R> {
  params: P;
  response: R;
  converter?: (arg: P) => any;
  arrayWrap?: boolean;
}

const CUSTOM_METHODS: Record<string, MethodConfig<any, any>> = {
  getAsset: {
    params: {} as string | GetAssetRequest,
    response: {} as Asset,
    arrayWrap: false,
  },
  getAssetBatch: {
    params: {} as string | GetAssetBatchRequest,
    response: {} as GetAssetBatchResponse,
    arrayWrap: false,
  },
  getAssetProof: {
    params: {} as GetAssetProofRequest,
    response: {} as GetAssetProofResponse,
    arrayWrap: false,
  },
  getPriorityFeeEstimate: {
    params: {} as GetPriorityFeeEstimateRequest,
    response: {} as GetPriorityFeeEstimateResponse,
    arrayWrap: true,
  },
};

// Factory for creating method handlers
const createMethodHandler = <P, R>(methodName: string, config: MethodConfig<P, R>) => (rawParams: P) => {
  let params = rawParams;
  if (config.converter) params = config.converter(rawParams);

  const request = {
    methodName,
    params: config.arrayWrap ? [params] : params,
  };

  return {
    execute: async (config) => {
      const response = await config.transport({
        payload: {
          jsonrpc: "2.0",
          id: "custom-id",
          method: request.methodName,
          params: request.params,
        },
        signal: config.signal,
      });
      return (response as { result: R }).result;
    },
  } as RpcPlan<R>;
};

export const customApiWrapper = (baseApi: RpcApi<SolanaRpcApi>) => {
  return new Proxy(baseApi, {
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    get(target, p) {
      const methodName = p.toString();
      const config = CUSTOM_METHODS[methodName];
      if (config) return createMethodHandler(methodName, config);

      // Delegate to base API for standard methods
      return Reflect.get(target, p);
    },
  }) as RpcApi<HeliusRpcApi>;
};