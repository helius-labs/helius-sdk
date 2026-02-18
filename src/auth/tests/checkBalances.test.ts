const mockSend = jest.fn();
const mockGetBalance = jest.fn(() => ({ send: mockSend }));
const mockGetTokenAccountBalance = jest.fn(() => ({ send: mockSend }));
const mockCreateSolanaRpc = jest.fn(() => ({
  getBalance: mockGetBalance,
  getTokenAccountBalance: mockGetTokenAccountBalance,
}));

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    createSolanaRpc: (...args: any[]) => mockCreateSolanaRpc(...args),
  };
});

jest.mock("@solana-program/token", () => ({
  findAssociatedTokenPda: jest
    .fn()
    .mockResolvedValue(["MockAtaAddress1111111111111111111111111111111"]),
  TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
}));

import { checkSolBalance, checkUsdcBalance } from "../checkBalances";

// Valid 32-byte base58 Solana address
const VALID_ADDRESS = "11111111111111111111111111111111";

describe("checkSolBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns SOL balance", async () => {
    mockSend.mockResolvedValue({ value: 5_000_000_000n });

    const balance = await checkSolBalance(VALID_ADDRESS);

    expect(balance).toBe(5_000_000_000n);
    expect(mockGetBalance).toHaveBeenCalled();
  });

  it("propagates RPC errors", async () => {
    mockSend.mockRejectedValue(new Error("RPC error"));

    await expect(checkSolBalance(VALID_ADDRESS)).rejects.toThrow("RPC error");
  });
});

describe("checkUsdcBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns USDC balance", async () => {
    mockSend.mockResolvedValue({ value: { amount: "2000000" } });

    const balance = await checkUsdcBalance(VALID_ADDRESS);

    expect(balance).toBe(2_000_000n);
  });

  it("returns 0n when token account does not exist", async () => {
    mockSend.mockRejectedValue(new Error("Account not found"));

    const balance = await checkUsdcBalance(VALID_ADDRESS);

    expect(balance).toBe(0n);
  });
});
