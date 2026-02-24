import {
  buildAndSendTokenTransfer,
  type TokenTransferParams,
} from "../buildTokenTransfer";

// Mock @solana/kit
const mockSend = jest.fn();
const mockGetLatestBlockhash = jest.fn(() => ({ send: mockSend }));
const mockRpc = { getLatestBlockhash: mockGetLatestBlockhash };
const mockSendAndConfirm = jest.fn().mockResolvedValue(undefined);

jest.mock("@solana/kit", () => {
  const mockAddress = "11111111111111111111111111111111";
  const mockSigner = {
    address: mockAddress,
    keyPair: {},
  };

  return {
    createSolanaRpc: jest.fn(() => mockRpc),
    createSolanaRpcSubscriptions: jest.fn(),
    sendAndConfirmTransactionFactory: jest.fn(() => mockSendAndConfirm),
    createKeyPairSignerFromBytes: jest.fn().mockResolvedValue(mockSigner),
    address: jest.fn((s: string) => s),
    pipe: jest.fn((...args: unknown[]) => {
      let result = args[0];
      for (let i = 1; i < args.length; i++) {
        result = (args[i] as (v: unknown) => unknown)(result);
      }
      return result;
    }),
    createTransactionMessage: jest.fn(() => ({})),
    setTransactionMessageFeePayerSigner: jest.fn(
      (_signer: unknown, tx: unknown) => tx
    ),
    setTransactionMessageLifetimeUsingBlockhash: jest.fn(
      (_bh: unknown, tx: unknown) => tx
    ),
    appendTransactionMessageInstructions: jest.fn(
      (_ixs: unknown, tx: unknown) => tx
    ),
    signTransactionMessageWithSigners: jest.fn().mockResolvedValue({}),
    getSignatureFromTransaction: jest.fn(() => "mock-signature-123"),
  };
});

jest.mock("@solana-program/token", () => ({
  getTransferInstruction: jest.fn(() => ({ programAddress: "token" })),
  findAssociatedTokenPda: jest.fn().mockResolvedValue(["mock-ata"]),
  TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
}));

describe("buildAndSendTokenTransfer", () => {
  const mockSecretKey = new Uint8Array(64).fill(1);

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({
      value: {
        blockhash: "mock-blockhash",
        lastValidBlockHeight: 100n,
      },
    });
  });

  it("sends a basic token transfer", async () => {
    const params: TokenTransferParams = {
      secretKey: mockSecretKey,
      recipientAddress: "RecipientAddress111111111111111111",
      mintAddress: "MintAddress1111111111111111111111" as `${string}`,
      amount: 1_000_000n,
    };

    const sig = await buildAndSendTokenTransfer(params);
    expect(sig).toBe("mock-signature-123");
    expect(mockSendAndConfirm).toHaveBeenCalledTimes(1);
  });

  it("includes additional instructions when provided", async () => {
    const { appendTransactionMessageInstructions } =
      jest.requireMock("@solana/kit");
    const memoIx = {
      programAddress: "Memo",
      accounts: [],
      data: new Uint8Array([1, 2, 3]),
    };

    const params: TokenTransferParams = {
      secretKey: mockSecretKey,
      recipientAddress: "RecipientAddress111111111111111111",
      mintAddress: "MintAddress1111111111111111111111" as `${string}`,
      amount: 500_000n,
      additionalInstructions: [memoIx as never],
    };

    await buildAndSendTokenTransfer(params);

    // Verify appendTransactionMessageInstructions was called with both transfer + memo
    const callArgs = appendTransactionMessageInstructions.mock.calls[0][0];
    expect(callArgs).toHaveLength(2);
    expect(callArgs[1]).toBe(memoIx);
  });

  it("works with no additional instructions (empty array)", async () => {
    const params: TokenTransferParams = {
      secretKey: mockSecretKey,
      recipientAddress: "RecipientAddress111111111111111111",
      mintAddress: "MintAddress1111111111111111111111" as `${string}`,
      amount: 1_000_000n,
      additionalInstructions: [],
    };

    const sig = await buildAndSendTokenTransfer(params);
    expect(sig).toBe("mock-signature-123");
  });
});
