import {
  Base64EncodedWireTransaction,
  Rpc,
  SolanaRpcApi,
  getBase64Decoder,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import { SendableTransaction, SendTransactionFn } from "./types";

export const makeSendTransaction = (rpc: Rpc<SolanaRpcApi>) => {
  const normalise = (tx: SendableTransaction): Base64EncodedWireTransaction => {
    if (typeof tx === "string") {
      return tx as Base64EncodedWireTransaction;
    }

    if ("base64" in tx && typeof tx.base64 === "string") {
      return tx.base64 as Base64EncodedWireTransaction;
    }

    if ("signed" in tx) {
      return getBase64EncodedWireTransaction(tx.signed as any);
    }

    if ("serialize" in tx && typeof tx.serialize === "function") {
      // Copy only the serialized bytes.
      return getBase64Decoder().decode(
        new Uint8Array(tx.serialize())
      ) as Base64EncodedWireTransaction;
    }

    throw new Error("Unsupported transaction shape passed to sendTransaction");
  };

  const send: SendTransactionFn = async (tx, opts = { skipPreflight: true }) =>
    rpc
      .sendTransaction(normalise(tx), { encoding: "base64", ...opts } as any)
      .send();

  return { send };
};
