import type { RpcApi, RpcPlan } from "@solana/kit";
import type { SolanaRpcApi } from "@solana/kit";
import type { HeliusRpcApi } from "./heliusRpcApi";
import type { Asset } from "../types/das";

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
      if (methodName === "getAsset") {
        return (arg: string | { id: string; options?: { showFungible?: boolean } }) => {
          const params = typeof arg === "string" ? { id: arg } : arg;
          const request = {
            methodName: "getAsset",
            params,
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
              return (response as { result: Asset }).result;
            },
          } as RpcPlan<Asset>;
        };
      }

      // Delegate to base API for standard methods
      return Reflect.get(target, p);
    },
  }) as RpcApi<HeliusRpcApi>;
};