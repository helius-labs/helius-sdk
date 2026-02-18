const mockSend = jest.fn();
const mockRpcSubscriptions = { subscribe: jest.fn() };
const mockSendAndConfirm = jest.fn().mockResolvedValue(undefined);
const mockSigner = {
  address: "SignerAddress1111111111111111111111111111111",
  signTransactions: jest.fn(),
};

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    createSolanaRpc: jest.fn(() => ({
      getLatestBlockhash: jest.fn(() => ({
        send: mockSend,
      })),
    })),
    createSolanaRpcSubscriptions: jest.fn(() => mockRpcSubscriptions),
    sendAndConfirmTransactionFactory: jest.fn(() => mockSendAndConfirm),
    createKeyPairSignerFromBytes: jest.fn().mockResolvedValue(mockSigner),
    pipe: jest.fn((...args: any[]) => {
      let result = args[0];
      for (let i = 1; i < args.length; i++) {
        result = args[i](result);
      }
      return result;
    }),
    createTransactionMessage: jest.fn(() => ({ instructions: [] })),
    setTransactionMessageFeePayerSigner: jest.fn((_, tx) => tx),
    setTransactionMessageLifetimeUsingBlockhash: jest.fn((_, tx) => tx),
    appendTransactionMessageInstructions: jest.fn((_, tx) => tx),
    signTransactionMessageWithSigners: jest.fn().mockResolvedValue({
      signatures: { SignerAddress1111111111111111111111111111111: new Uint8Array(64) },
    }),
    getSignatureFromTransaction: jest.fn(() => "tx-signature-abc123"),
  };
});

jest.mock("@solana-program/token", () => ({
  findAssociatedTokenPda: jest.fn().mockResolvedValue(["MockAta111111111111111111111111111111111111"]),
  TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  getTransferInstruction: jest.fn(() => ({ programAddress: "token" })),
}));

import { payUSDC } from "../payUSDC";
import {
  createSolanaRpc,
  sendAndConfirmTransactionFactory,
  createKeyPairSignerFromBytes,
  getSignatureFromTransaction,
} from "@solana/kit";
import { findAssociatedTokenPda, getTransferInstruction } from "@solana-program/token";

const MOCK_SECRET_KEY = new Uint8Array(64);

describe("payUSDC", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({
      value: {
        blockhash: "mockBlockhash11111111111111111111111111111111",
        lastValidBlockHeight: 100n,
      },
    });
  });

  it("creates a signer from the secret key", async () => {
    await payUSDC(MOCK_SECRET_KEY);

    expect(createKeyPairSignerFromBytes).toHaveBeenCalledWith(MOCK_SECRET_KEY);
  });

  it("derives ATAs for sender and treasury", async () => {
    await payUSDC(MOCK_SECRET_KEY);

    expect(findAssociatedTokenPda).toHaveBeenCalledTimes(2);
    // Sender ATA
    expect(findAssociatedTokenPda).toHaveBeenCalledWith(
      expect.objectContaining({ owner: mockSigner.address })
    );
    // Treasury ATA
    expect(findAssociatedTokenPda).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "CEs84tEowsXpH8u4VBf8rJSVgSRypFMfXw9CpGRtQgb6",
      })
    );
  });

  it("fetches latest blockhash", async () => {
    await payUSDC(MOCK_SECRET_KEY);

    expect(mockSend).toHaveBeenCalled();
  });

  it("builds a transfer instruction with PAYMENT_AMOUNT", async () => {
    await payUSDC(MOCK_SECRET_KEY);

    expect(getTransferInstruction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1_000_000n })
    );
  });

  it("sends and confirms the transaction", async () => {
    await payUSDC(MOCK_SECRET_KEY);

    expect(mockSendAndConfirm).toHaveBeenCalledWith(
      expect.anything(),
      { commitment: "confirmed" }
    );
  });

  it("returns the transaction signature", async () => {
    const result = await payUSDC(MOCK_SECRET_KEY);

    expect(result).toBe("tx-signature-abc123");
    expect(getSignatureFromTransaction).toHaveBeenCalled();
  });

  it("propagates RPC errors", async () => {
    mockSend.mockRejectedValue(new Error("RPC unavailable"));

    await expect(payUSDC(MOCK_SECRET_KEY)).rejects.toThrow("RPC unavailable");
  });

  it("propagates send-and-confirm failures", async () => {
    mockSendAndConfirm.mockRejectedValue(new Error("Transaction failed"));

    await expect(payUSDC(MOCK_SECRET_KEY)).rejects.toThrow("Transaction failed");
  });
});
