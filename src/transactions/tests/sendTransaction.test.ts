import { Base64EncodedWireTransaction, Signature } from "@solana/kit";
import { makeSendTransaction } from "../sendTransaction";

const BASE64_TX = "BASE64_WIRE_TX" as Base64EncodedWireTransaction;
const SIGNATURE = "sig123" as Signature;

const mockSend = jest.fn().mockResolvedValue(SIGNATURE);
const mockRpc: any = {
  sendTransaction: jest.fn(() => ({ send: mockSend })),
};

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    getBase64EncodedWireTransaction: jest.fn(() => BASE64_TX),
  };
});
const { getBase64EncodedWireTransaction } = require("@solana/kit");

const { send: sendTx } = makeSendTransaction(mockRpc);

const serialisable = {
  serialize: () => new Uint8Array([1, 2, 3]),
};

const smartLike = {
  signed: serialisable,
  base64: BASE64_TX,
};


describe("sendTransaction Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Accepts a raw base64 string", async () => {
    await sendTx(BASE64_TX);
    expect(mockRpc.sendTransaction).toHaveBeenCalledWith(
      BASE64_TX,
      expect.objectContaining({ encoding: "base64" }),
    );
  });

  it("Accepts a base64 object", async () => {
    await sendTx({ base64: BASE64_TX } as any);
    expect(mockRpc.sendTransaction).toHaveBeenCalledWith(
      BASE64_TX,
      expect.any(Object),
    );
  });

  it("Accepts a signed.serialize() object", async () => {
    await sendTx(smartLike as any);
    expect(getBase64EncodedWireTransaction).not.toHaveBeenCalled();
    expect(mockRpc.sendTransaction).toHaveBeenCalledWith(
      BASE64_TX,
      expect.any(Object),
    );
  });

  it("Accepts a serialisable object", async () => {
    await sendTx(serialisable as any);
    expect(getBase64EncodedWireTransaction).toHaveBeenCalledWith(serialisable);
    expect(mockRpc.sendTransaction).toHaveBeenCalledWith(
      BASE64_TX,
      expect.any(Object),
    );
  });

  it("Returns the RPC signature", async () => {
    const sig = await sendTx(BASE64_TX);
    expect(sig).toBe(SIGNATURE);
  });
});
