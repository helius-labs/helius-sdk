import {
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";

import { makePollTransactionConfirmation } from "./pollTransactionConfirmation";
import { senderFastUrl, type SenderRegion, type SignedTx } from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_MS = 2_000;
const MAX_BUNDLE_SIZE = 5;

/** A signed transaction accepted by the Sender bundle helper. */
export type SignedBundleTransaction = SignedTx;

/** Options for `sendBundleWithSender`. */
export interface SendBundleOptions {
  /** Sender region to route through. Defaults to `"Default"`. */
  region?: SenderRegion;
  /** Overall polling timeout in milliseconds. */
  pollTimeoutMs?: number;
  /** Polling cadence in milliseconds. */
  pollIntervalMs?: number;
}

/** Internal dependencies for `sendBundleWithSender`. */
export interface SendBundleDeps {
  raw: Rpc<SolanaRpcApi>;
}

/**
 * Submit a **bundle** of up to 5 transactions to Sender Max via `sendBundle`.
 *
 * Sender Max handles single transactions and bundles over the same paths and
 * priority auction. The caller only needs to include the **0.001 SOL Sender
 * tip** in at least one transaction of the bundle — Helius adds any pathway tips
 * on your behalf. Do **not** add a separate pathway-specific tip or set a
 * pathway-region header.
 *
 * Bundles are submitted to the Sender endpoint
 * (`https://sender.helius-rpc.com/fast` and regional hosts) with
 * `method: "sendBundle"` and `params: [[base64Tx, ...], { encoding: "base64" }]`.
 *
 * Landing is tracked via each transaction's **signature** (`getSignatureStatuses`),
 * not bundle IDs / `getBundleStatuses`.
 *
 * @returns the signatures of every transaction in the bundle, in submission order.
 */
export const makeSendBundleWithSender = (deps: SendBundleDeps) => {
  const { raw } = deps;
  const poll = makePollTransactionConfirmation(raw);

  const sendBundle = async (
    transactions: readonly SignedBundleTransaction[],
    options: SendBundleOptions = {}
  ): Promise<string[]> => {
    const {
      region = "Default",
      pollTimeoutMs = DEFAULT_TIMEOUT_MS,
      pollIntervalMs = DEFAULT_POLL_MS,
    } = options;

    if (transactions.length === 0) {
      throw new Error("Bundle must contain at least one transaction");
    }
    if (transactions.length > MAX_BUNDLE_SIZE) {
      throw new Error(
        `Bundle supports at most ${MAX_BUNDLE_SIZE} transactions, got ${transactions.length}`
      );
    }

    const encoded = transactions.map((tx) =>
      getBase64EncodedWireTransaction(tx)
    );
    const signatures = transactions.map((tx) =>
      getSignatureFromTransaction(tx)
    );

    // Bundles always go through Sender Max — no `?swqos_only=true`.
    const res = await fetch(senderFastUrl(region), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now().toString(),
        method: "sendBundle",
        params: [encoded, { encoding: "base64" }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Sender bundle HTTP ${res.status}: ${text.slice(0, 200)}`
      );
    }

    const body: unknown = await res.json();
    if (body && typeof body === "object" && "error" in body && body.error) {
      throw new Error(
        `Sender bundle error: ${JSON.stringify((body as { error: unknown }).error)}`
      );
    }
    // The result (bundle id, etc.) is intentionally ignored — landing is tracked
    // by transaction signature, not bundle id.

    // Determine a shared lastValidBlockHeight from any provided blockhash lifetime.
    let lastValidBlockHeight: bigint | undefined;
    for (const tx of transactions) {
      const lifetime = tx.lifetimeConstraint;
      const lvbh =
        lifetime && "lastValidBlockHeight" in lifetime
          ? lifetime.lastValidBlockHeight
          : undefined;
      if (lvbh !== undefined) {
        lastValidBlockHeight =
          lastValidBlockHeight === undefined
            ? lvbh
            : lvbh < lastValidBlockHeight
              ? lvbh
              : lastValidBlockHeight;
      }
    }

    // Track landing via each transaction's signature.
    for (const signature of signatures) {
      await poll(signature, {
        timeout: pollTimeoutMs,
        interval: pollIntervalMs,
        lastValidBlockHeight,
      });
    }

    return signatures;
  };

  return { sendBundle };
};
