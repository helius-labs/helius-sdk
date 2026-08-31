import type { RpcTransport } from "@solana/kit";

/**
 * Hook for augmenting or replacing the SDK's default RPC transport.
 *
 * Receives the fully configured default transport (Helius URL with API key,
 * SDK headers, and request-id stamping) and returns the transport the client
 * will use. Follows `@solana/kit`'s transport-augmentation pattern, enabling
 * retries, failover, logging, and similar policies.
 *
 * @example
 * ```ts
 * const helius = createHelius({
 *   apiKey,
 *   transport: (defaultTransport) => async (request) => {
 *     // custom retry / failover / logging logic around defaultTransport
 *     return defaultTransport(request);
 *   },
 * });
 * ```
 */
export type TransportHook = (defaultTransport: RpcTransport) => RpcTransport;

/**
 * Apply an optional {@link TransportHook} to the default transport, guarding
 * against hooks that don't return a transport (e.g. a transport passed
 * directly instead of a wrapper function).
 */
export const resolveTransport = (
  defaultTransport: RpcTransport,
  hook?: TransportHook
): RpcTransport => {
  if (!hook) return defaultTransport;

  const transport = hook(defaultTransport);
  if (typeof transport !== "function") {
    throw new Error(
      "The transport option must be a function that receives the default transport and returns an RpcTransport."
    );
  }
  return transport;
};

/**
 * Wrap a transport so every outgoing JSON-RPC payload is stamped with the
 * SDK's request id.
 */
export const withSdkRequestId =
  (baseTransport: RpcTransport): RpcTransport =>
  async <TResponse>(
    request: Parameters<RpcTransport>[0]
  ): Promise<TResponse> => {
    const payload = {
      ...(request.payload as Record<string, unknown>),
      id: "helius-sdk",
    };

    return baseTransport({ ...request, payload });
  };
