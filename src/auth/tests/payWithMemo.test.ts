import { payWithMemo } from "../payWithMemo";
import { buildAndSendTokenTransfer } from "../buildTokenTransfer";
import { USDC_MINT, MEMO_PROGRAM_ID } from "../constants";

jest.mock("../buildTokenTransfer");
jest.mock("@solana/kit", () => ({
  createKeyPairSignerFromBytes: jest.fn().mockResolvedValue({
    address: "SignerAddress1111111111111111111",
  }),
}));

const mockBuildAndSend = buildAndSendTokenTransfer as jest.MockedFunction<typeof buildAndSendTokenTransfer>;

describe("payWithMemo", () => {
  const mockSecretKey = new Uint8Array(64).fill(1);

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildAndSend.mockResolvedValue("tx-signature-abc");
  });

  it("calls buildAndSendTokenTransfer with correct params", async () => {
    const sig = await payWithMemo(
      mockSecretKey,
      "TreasuryAddress111111111111111111",
      1_000_000n,
      "pi_test123",
    );

    expect(sig).toBe("tx-signature-abc");
    expect(mockBuildAndSend).toHaveBeenCalledTimes(1);

    const callArgs = mockBuildAndSend.mock.calls[0][0];
    expect(callArgs.secretKey).toBe(mockSecretKey);
    expect(callArgs.recipientAddress).toBe("TreasuryAddress111111111111111111");
    expect(callArgs.mintAddress).toBe(USDC_MINT);
    expect(callArgs.amount).toBe(1_000_000n);
  });

  it("includes a memo instruction", async () => {
    await payWithMemo(
      mockSecretKey,
      "TreasuryAddress111111111111111111",
      1_000_000n,
      "pi_test123",
    );

    const callArgs = mockBuildAndSend.mock.calls[0][0];
    expect(callArgs.additionalInstructions).toHaveLength(1);

    const memoIx = callArgs.additionalInstructions![0];
    expect(memoIx.programAddress).toBe(MEMO_PROGRAM_ID);
    expect(new TextDecoder().decode(memoIx.data as Uint8Array)).toBe("pi_test123");
  });

  it("includes signer in memo instruction accounts", async () => {
    await payWithMemo(
      mockSecretKey,
      "TreasuryAddress111111111111111111",
      1_000_000n,
      "memo-content",
    );

    const memoIx = mockBuildAndSend.mock.calls[0][0].additionalInstructions![0];
    expect(memoIx.accounts).toHaveLength(1);
    expect(memoIx.accounts![0]).toEqual({
      address: "SignerAddress1111111111111111111",
      role: 3,
    });
  });
});
