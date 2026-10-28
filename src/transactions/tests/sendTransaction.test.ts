import {
  blockhash,
  createKeyPairSignerFromPrivateKeyBytes,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  getTransactionEncoder,
  signTransactionMessageWithSigners,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import { createTxMessage } from "../createTxMessage";
import { makeSendTransaction } from "../sendTransaction";

const makeSignedTransaction = async () => {
  const signer = await createKeyPairSignerFromPrivateKeyBytes(
    new Uint8Array(32).fill(1)
  );
  return signTransactionMessageWithSigners(
    createTxMessage({
      version: 0,
      feePayer: signer,
      lifetime: {
        blockhash: blockhash("11111111111111111111111111111111"),
        lastValidBlockHeight: 100n,
      },
      instructions: [],
    })
  );
};

describe("sendTransaction Tests", () => {
  let signed: Awaited<ReturnType<typeof makeSignedTransaction>>;
  const mockSend = jest.fn();
  const sendTransaction = jest.fn(() => ({ send: mockSend }));
  const { send } = makeSendTransaction({
    sendTransaction,
  } as unknown as Rpc<SolanaRpcApi>);

  beforeAll(async () => {
    signed = await makeSignedTransaction();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue(getSignatureFromTransaction(signed));
  });

  it.each(["string", "base64", "signed", "serialize"] as const)(
    "Sends identical wire bytes for the %s input shape",
    async (shape) => {
      const base64 = getBase64EncodedWireTransaction(signed);
      const wire = getTransactionEncoder().encode(signed);
      const serialisable = {
        // The serializer may use its receiver, like a transaction class does.
        wire: new Uint8Array(wire),
        serialize: jest.fn(function (this: { wire: Uint8Array }) {
          return this.wire;
        }),
      };
      const inputs = {
        string: base64,
        base64: { base64 },
        signed: { signed },
        serialize: serialisable,
      };

      const signature = await send(inputs[shape], {
        skipPreflight: false,
        maxRetries: 2,
      });

      expect(signature).toBe(getSignatureFromTransaction(signed));
      expect(sendTransaction).toHaveBeenCalledWith(base64, {
        encoding: "base64",
        skipPreflight: false,
        maxRetries: 2,
      });
      expect(serialisable.serialize).toHaveBeenCalledTimes(
        shape === "serialize" ? 1 : 0
      );
    }
  );

  it("Prefers supplied base64 over serialization", async () => {
    const base64 = getBase64EncodedWireTransaction(signed);
    const serialize = jest.fn(() => {
      throw new Error("should not serialize");
    });
    await send({ base64, serialize });
    expect(serialize).not.toHaveBeenCalled();
    expect(sendTransaction).toHaveBeenCalledWith(base64, {
      encoding: "base64",
      skipPreflight: true,
    });
  });

  it("Does not send when serialization fails", async () => {
    const error = new Error("serialization failed");
    await expect(
      send({
        serialize() {
          throw error;
        },
      })
    ).rejects.toBe(error);
    expect(sendTransaction).not.toHaveBeenCalled();
  });
});
