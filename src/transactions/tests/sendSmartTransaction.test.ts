import { address, type Instruction } from "@solana/kit";
import { makeSendSmartTransaction } from "../sendSmartTransaction";

// Inner send‑and‑confirm implementation
const mockSendAndConfirm = jest.fn().mockResolvedValue(undefined);
// Factory that returns the above function
const mockSendAndConfirmFactory = jest.fn().mockReturnValue(mockSendAndConfirm);
// Helper that extracts the signature from the signed tx
const mockGetSignature = jest.fn().mockReturnValue("FAKE_SIG");

// jest‑mock the specific exports, everything else passes through
jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    sendAndConfirmTransactionFactory: (
      ...args: Parameters<typeof actual.sendAndConfirmTransactionFactory>
    ) => mockSendAndConfirmFactory(...args),
    getSignatureFromTransaction: (tx: any) => mockGetSignature(tx),
  };
});

// Minimal “signed” transaction object; its internals don’t matter here
const signedTx: any = { signatures: ["deadbeef"] };

const createSmartTransaction = jest
  .fn()
  .mockResolvedValue({ signed: signedTx });

const dummyRpc: any = {};
const dummyWs: any = {
  // Only the method used by @solana/kit confirmation logic:
  signatureNotifications: () => ({
    subscribe: () => ({ unsubscribe() {} }),
  }),
};

const makeNoopIx = (p: string): Instruction<string, []> => ({
  programAddress: address(p),
  accounts: [],
  data: new Uint8Array(),
});

const userInput = {
  signers: [], // None needed as the builder is mocked
  instructions: [makeNoopIx("11111111111111111111111111111111")],
  version: 0,
} as const;

describe("sendSmartTransaction Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the tx then sends/ confirms it over WebSocket, returning its signature", async () => {
    const { send } = makeSendSmartTransaction({
      raw: dummyRpc,
      rpcSubscriptions: dummyWs,
      createSmartTransaction,
    });

    const sig = await send({
      ...userInput,
      confirmCommitment: "finalized",
      maxRetries: 1n,
      skipPreflight: false,
    });

    expect(createSmartTransaction).toHaveBeenCalledTimes(1);
    expect(createSmartTransaction).toHaveBeenCalledWith(userInput);
    expect(mockSendAndConfirmFactory).toHaveBeenCalledWith({
      rpc: dummyRpc,
      rpcSubscriptions: dummyWs,
    });
    expect(mockSendAndConfirm).toHaveBeenCalledWith(
      signedTx,
      expect.objectContaining({
        commitment: "finalized",
        maxRetries: 1n,
        skipPreflight: false,
      })
    );
    expect(mockGetSignature).toHaveBeenCalledWith(signedTx);
    expect(sig).toBe("FAKE_SIG");
  });
});
